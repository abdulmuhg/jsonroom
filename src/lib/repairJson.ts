/**
 * Attempt to repair broken JSON strings.
 *
 * Handles (in order):
 * 1. Strip JS-style comments (// and /* *​/)
 * 2. Replace single quotes with double quotes (context-aware)
 * 3. Quote unquoted keys
 * 4. Fix unquoted string values
 * 5. Remove trailing commas before } or ]
 * 6. Insert missing commas between entries
 * 7. Replace JS literals (undefined, NaN, Infinity, -Infinity) with null
 * 8. Fix missing closing brackets/braces
 * 9. Fix extra closing brackets/braces
 *
 * Returns { ok, result, fixes } where `fixes` describes what was changed.
 */

export interface RepairResult {
  ok: true;
  result: string;
  value: unknown;
  fixes: string[];
}

export interface RepairFailure {
  ok: false;
  error: string;
}

export type RepairOutcome = RepairResult | RepairFailure;

export function repairJson(input: string): RepairOutcome {
  let text = input.trim();
  const fixes: string[] = [];

  if (!text) {
    return { ok: false, error: 'Empty input' };
  }

  // --- 0. Quick check: already valid? ---
  try {
    const value = JSON.parse(text);
    return { ok: true, result: JSON.stringify(value, null, 2), value, fixes: [] };
  } catch {
    // Continue with repairs
  }

  // --- 1. Strip comments ---
  {
    const before = text;
    text = stripComments(text);
    if (text !== before) fixes.push('Removed comments');
  }

  // --- 2. Replace single quotes with double quotes ---
  {
    const before = text;
    text = replaceSingleQuotes(text);
    if (text !== before) fixes.push('Replaced single quotes with double quotes');
  }

  // --- 3. Quote unquoted keys ---
  {
    const before = text;
    text = quoteUnquotedKeys(text);
    if (text !== before) fixes.push('Added quotes to unquoted keys');
  }

  // --- 4. Replace JS literals (undefined, NaN, Infinity) ---
  {
    const before = text;
    text = replaceJsLiterals(text);
    if (text !== before) fixes.push('Replaced JS literals (undefined/NaN/Infinity) with null');
  }

  // --- 5. Fix unquoted string values ---
  {
    const before = text;
    text = quoteUnquotedValues(text);
    if (text !== before) fixes.push('Added quotes to unquoted string values');
  }

  // --- 6. Insert missing commas ---
  {
    const before = text;
    text = insertMissingCommas(text);
    if (text !== before) fixes.push('Inserted missing commas');
  }

  // --- 7. Remove trailing commas ---
  {
    const before = text;
    text = removeTrailingCommas(text);
    if (text !== before) fixes.push('Removed trailing commas');
  }

  // Try parsing now before bracket fixes
  try {
    const value = JSON.parse(text);
    return { ok: true, result: JSON.stringify(value, null, 2), value, fixes };
  } catch {
    // Continue
  }

  // --- 8. Fix mismatched brackets ---
  {
    const before = text;
    text = fixBrackets(text);
    if (text !== before) fixes.push('Fixed mismatched brackets/braces');
  }

  // --- Final parse attempt ---
  try {
    const value = JSON.parse(text);
    return { ok: true, result: JSON.stringify(value, null, 2), value, fixes };
  } catch (err) {
    // One more attempt: wrap bare values in object or array
    const wrapped = tryWrap(text);
    if (wrapped !== null) {
      try {
        const value = JSON.parse(wrapped);
        fixes.push('Wrapped content in brackets');
        return { ok: true, result: JSON.stringify(value, null, 2), value, fixes };
      } catch {
        // Give up
      }
    }

    return {
      ok: false,
      error: `Could not repair JSON: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Repair helpers
// ---------------------------------------------------------------------------

/** Strip // line comments and /* block comments *​/ outside of strings. */
function stripComments(text: string): string {
  let result = '';
  let i = 0;
  while (i < text.length) {
    // Inside a string — skip to end
    if (text[i] === '"') {
      result += '"';
      i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\') {
          result += text[i] + (text[i + 1] ?? '');
          i += 2;
        } else {
          result += text[i];
          i++;
        }
      }
      if (i < text.length) {
        result += '"';
        i++;
      }
      continue;
    }
    // Line comment
    if (text[i] === '/' && text[i + 1] === '/') {
      // Skip to end of line
      while (i < text.length && text[i] !== '\n') i++;
      continue;
    }
    // Block comment
    if (text[i] === '/' && text[i + 1] === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i += 2; // skip */
      continue;
    }
    result += text[i];
    i++;
  }
  return result;
}

/** Replace single-quoted strings with double-quoted, handling escapes. */
function replaceSingleQuotes(text: string): string {
  let result = '';
  let i = 0;
  while (i < text.length) {
    // Skip existing double-quoted strings
    if (text[i] === '"') {
      result += '"';
      i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\') {
          result += text[i] + (text[i + 1] ?? '');
          i += 2;
        } else {
          result += text[i];
          i++;
        }
      }
      if (i < text.length) {
        result += '"';
        i++;
      }
      continue;
    }
    // Convert single-quoted strings
    if (text[i] === "'") {
      result += '"';
      i++;
      while (i < text.length && text[i] !== "'") {
        if (text[i] === '\\') {
          if (text[i + 1] === "'") {
            // \' → just ' inside double quotes
            result += "'";
            i += 2;
          } else {
            result += text[i] + (text[i + 1] ?? '');
            i += 2;
          }
        } else if (text[i] === '"') {
          // Escape double quotes that appear inside
          result += '\\"';
          i++;
        } else {
          result += text[i];
          i++;
        }
      }
      if (i < text.length) {
        result += '"';
        i++;
      }
      continue;
    }
    result += text[i];
    i++;
  }
  return result;
}

/** Add double quotes around unquoted object keys. */
function quoteUnquotedKeys(text: string): string {
  // Match unquoted keys after { , } ] or at start of a line
  // but NOT inside strings
  return processOutsideStrings(text, (segment) =>
    segment.replace(
      /([{,}\]\n]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g,
      '$1"$2"$3',
    ),
  );
}

/** Replace undefined, NaN, Infinity, -Infinity with null. */
function replaceJsLiterals(text: string): string {
  return processOutsideStrings(text, (segment) =>
    segment
      .replace(/\bundefined\b/g, 'null')
      .replace(/\bNaN\b/g, 'null')
      .replace(/([^"\\]|^)-?Infinity\b/g, '$1null'),
  );
}

/** Quote unquoted string values (values that are bare words after a colon). */
function quoteUnquotedValues(text: string): string {
  return processOutsideStrings(text, (segment) =>
    segment.replace(
      /(:\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*([,}\]\n])/g,
      (match, colon: string, val: string, after: string) => {
        // Skip known literals
        if (['true', 'false', 'null'].includes(val)) return match;
        return `${colon}"${val}"${after}`;
      },
    ),
  );
}

/** Insert missing commas between entries. E.g. "a": 1 "b": 2 → "a": 1, "b": 2 */
/** Insert missing commas. Works on the full text, skipping string interiors. */
function insertMissingCommas(text: string): string {
  // We need to match across string boundaries, so process the full text
  // but skip characters inside strings.
  // Strategy: find lines ending with a value (not a comma), followed by a line
  // starting with a key or value opener.
  let result = '';
  let i = 0;
  while (i < text.length) {
    // Skip strings
    if (text[i] === '"') {
      result += '"';
      i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\') {
          result += text[i] + (text[i + 1] ?? '');
          i += 2;
        } else {
          result += text[i];
          i++;
        }
      }
      if (i < text.length) {
        result += '"';
        i++;
      }

      // After closing a string, check if we need a comma:
      // If next non-whitespace on the same line is a newline (no comma),
      // and the next non-whitespace content starts a new value/key
      const afterQuote = text.slice(i);
      const newlineMatch = afterQuote.match(/^([ \t]*)\n([ \t]*)/);
      if (newlineMatch) {
        const restAfterNewline = afterQuote.slice(newlineMatch[0].length);
        // Next meaningful char starts a new key or value
        if (/^["{\[\d]|^true|^false|^null/.test(restAfterNewline)) {
          result += newlineMatch[1] + ',\n' + newlineMatch[2];
          i += newlineMatch[0].length;
          continue;
        }
      }
      continue;
    }
    // After numbers/bools/null/closing brackets, check for missing comma
    const numMatch = text.slice(i).match(/^(-?[\d.]+(?:[eE][+-]?\d+)?|true|false|null|[}\]])/);
    if (numMatch) {
      result += numMatch[0];
      i += numMatch[0].length;

      const afterVal = text.slice(i);
      const nlMatch = afterVal.match(/^([ \t]*)\n([ \t]*)/);
      if (nlMatch) {
        const restAfterNl = afterVal.slice(nlMatch[0].length);
        if (/^["{\[\d]|^true|^false|^null/.test(restAfterNl)) {
          result += nlMatch[1] + ',\n' + nlMatch[2];
          i += nlMatch[0].length;
          continue;
        }
      }
      continue;
    }
    result += text[i];
    i++;
  }
  return result;
}

/** Remove trailing commas before ] or }. */
function removeTrailingCommas(text: string): string {
  return processOutsideStrings(text, (segment) =>
    segment.replace(/,(\s*[}\]])/g, '$1'),
  );
}

/** Fix mismatched brackets by adding missing closers or removing extras. */
function fixBrackets(text: string): string {
  const stack: string[] = [];
  let i = 0;

  // Walk through, tracking bracket depth (skip strings)
  while (i < text.length) {
    if (text[i] === '"') {
      i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\') i++;
        i++;
      }
      i++; // skip closing "
      continue;
    }
    if (text[i] === '{' || text[i] === '[') {
      stack.push(text[i]);
    } else if (text[i] === '}') {
      if (stack.length > 0 && stack[stack.length - 1] === '{') {
        stack.pop();
      } else if (stack.length === 0) {
        // Extra closer — remove it
        text = text.slice(0, i) + text.slice(i + 1);
        continue; // don't increment i
      }
    } else if (text[i] === ']') {
      if (stack.length > 0 && stack[stack.length - 1] === '[') {
        stack.pop();
      } else if (stack.length === 0) {
        text = text.slice(0, i) + text.slice(i + 1);
        continue;
      }
    }
    i++;
  }

  // Add missing closers
  while (stack.length > 0) {
    const opener = stack.pop()!;
    text += opener === '{' ? '}' : ']';
  }

  return text;
}

/** Try wrapping bare content that looks like object entries or array items. */
function tryWrap(text: string): string | null {
  const trimmed = text.trim();
  // Looks like object entries: "key": value
  if (/^\s*"/.test(trimmed) && trimmed.includes(':')) {
    return `{${trimmed}}`;
  }
  return null;
}

/**
 * Process only the parts of text that are outside JSON strings.
 * Splits text into string-literal segments and non-string segments,
 * applies `fn` only to non-string segments, then reassembles.
 */
function processOutsideStrings(text: string, fn: (segment: string) => string): string {
  const parts: { text: string; isString: boolean }[] = [];
  let i = 0;
  let current = '';

  while (i < text.length) {
    if (text[i] === '"') {
      // Push any accumulated non-string content
      if (current) {
        parts.push({ text: current, isString: false });
        current = '';
      }
      // Capture the string literal
      let str = '"';
      i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\') {
          str += text[i] + (text[i + 1] ?? '');
          i += 2;
        } else {
          str += text[i];
          i++;
        }
      }
      if (i < text.length) {
        str += '"';
        i++;
      }
      parts.push({ text: str, isString: true });
      continue;
    }
    current += text[i];
    i++;
  }
  if (current) {
    parts.push({ text: current, isString: false });
  }

  return parts.map((p) => (p.isString ? p.text : fn(p.text))).join('');
}
