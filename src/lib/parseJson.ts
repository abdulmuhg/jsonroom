/**
 * Smart JSON parser that handles common messy-input cases:
 * - Surrounding whitespace and log-line prefixes
 * - Escaped JSON strings ("\"key\":\"value\"")
 * - JSON wrapped in outer quotes (from logs)
 * - Multiple levels of escaping
 */

export type ParseResult =
  | { ok: true; value: unknown; unescapedLevels: number; trimmedPrefix: boolean }
  | { ok: false; error: string; position?: number };

const LOG_PREFIX_PATTERNS: RegExp[] = [
  // ISO timestamp + level: "2026-04-19T14:32:01.123Z INFO "
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\s+\w+\s+/,
  // Syslog-ish: "Apr 19 14:32:01 host service: "
  /^\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\S+\s+\S+:\s+/,
  // Bracketed level prefixes: "[INFO] "
  /^\[(INFO|DEBUG|WARN|ERROR|TRACE)\]\s*/i,
];

function stripLogPrefix(input: string): { text: string; trimmed: boolean } {
  for (const re of LOG_PREFIX_PATTERNS) {
    if (re.test(input)) {
      return { text: input.replace(re, ''), trimmed: true };
    }
  }
  return { text: input, trimmed: false };
}

function isJsonLike(s: string): boolean {
  const t = s.trim();
  return (
    (t.startsWith('{') && t.endsWith('}')) ||
    (t.startsWith('[') && t.endsWith(']'))
  );
}

export function parseJson(raw: string): ParseResult {
  if (!raw || !raw.trim()) {
    return { ok: false, error: 'Empty input' };
  }

  let text = raw.trim();
  let unescapedLevels = 0;

  // Strip log-line prefixes.
  const stripped = stripLogPrefix(text);
  text = stripped.text.trim();
  const trimmedPrefix = stripped.trimmed;

  // Try parsing directly first.
  let lastError: string | undefined;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const value = JSON.parse(text);
      if (typeof value === 'string' && isJsonLike(value)) {
        // Double-escaped JSON — unwrap and keep going.
        text = value.trim();
        unescapedLevels++;
        continue;
      }
      return { ok: true, value, unescapedLevels, trimmedPrefix };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      // If the text is wrapped in quotes, try unquoting.
      if (
        (text.startsWith('"') && text.endsWith('"')) ||
        (text.startsWith("'") && text.endsWith("'"))
      ) {
        text = text.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        unescapedLevels++;
        continue;
      }
      break;
    }
  }

  return { ok: false, error: lastError ?? 'Invalid JSON' };
}

export function formatJson(value: unknown, indent = 2): string {
  return JSON.stringify(value, null, indent);
}

export function countKeys(value: unknown): number {
  if (value === null || typeof value !== 'object') return 0;
  if (Array.isArray(value)) {
    return value.reduce<number>((sum, v) => sum + countKeys(v), value.length);
  }
  const entries = Object.entries(value);
  return entries.reduce<number>((sum, [, v]) => sum + countKeys(v), entries.length);
}

export function approximateSize(text: string): string {
  const bytes = new Blob([text]).size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
