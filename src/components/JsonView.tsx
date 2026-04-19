import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { SearchMatch } from '../hooks/useSearch';

interface Props {
  value: unknown;
  highlightPaths?: Map<string, 'added' | 'removed' | 'changed'>;
  searchMatches?: Map<string, SearchMatch>;
  activeMatchPath?: string;
  expandPaths?: Set<string>;
  query?: string;
  caseSensitive?: boolean;
}

function typeLabel(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

export function JsonView({
  value,
  highlightPaths,
  searchMatches,
  activeMatchPath,
  expandPaths,
  query,
  caseSensitive,
}: Props) {
  return (
    <div className="font-mono text-[13px] leading-6 scrollbar-thin overflow-auto p-4">
      <Node
        name={null}
        value={value}
        path=""
        depth={0}
        highlightPaths={highlightPaths}
        searchMatches={searchMatches}
        activeMatchPath={activeMatchPath}
        expandPaths={expandPaths}
        query={query}
        caseSensitive={caseSensitive}
      />
    </div>
  );
}

interface NodeProps {
  name: string | number | null;
  value: unknown;
  path: string;
  depth: number;
  highlightPaths?: Map<string, 'added' | 'removed' | 'changed'>;
  searchMatches?: Map<string, SearchMatch>;
  activeMatchPath?: string;
  expandPaths?: Set<string>;
  query?: string;
  caseSensitive?: boolean;
  trailingComma?: boolean;
}

function Node({
  name,
  value,
  path,
  depth,
  highlightPaths,
  searchMatches,
  activeMatchPath,
  expandPaths,
  query,
  caseSensitive,
  trailingComma,
}: NodeProps) {
  const [open, setOpen] = useState(depth < 2);
  const kind = typeLabel(value);
  const highlight = highlightPaths?.get(path);
  const searchMatch = searchMatches?.get(path);
  const isActiveMatch = activeMatchPath === path;
  const shouldForceExpand = expandPaths?.has(path);

  useEffect(() => {
    if (shouldForceExpand) setOpen(true);
  }, [shouldForceExpand]);

  const hlClass = useMemo(() => {
    if (!highlight) return '';
    if (highlight === 'added') return 'bg-diff-addBg border-l-2 border-diff-add pl-1';
    if (highlight === 'removed') return 'bg-diff-removeBg border-l-2 border-diff-remove pl-1';
    return 'bg-diff-changeBg border-l-2 border-diff-change pl-1';
  }, [highlight]);

  const indent = { paddingLeft: `${depth * 16}px` };

  const childProps = {
    highlightPaths,
    searchMatches,
    activeMatchPath,
    expandPaths,
    query,
    caseSensitive,
  };

  if (kind === 'array' || kind === 'object') {
    const entries =
      kind === 'array'
        ? (value as unknown[]).map((v, i) => [i, v] as const)
        : Object.entries(value as Record<string, unknown>);
    const open_br = kind === 'array' ? '[' : '{';
    const close_br = kind === 'array' ? ']' : '}';

    const keyHighlight = searchMatch?.matchesKey;

    return (
      <div className={hlClass} style={indent}>
        <div
          className={[
            'flex items-start rounded-sm',
            isActiveMatch
              ? 'bg-search-active border-l-2 border-search-activeBorder pl-1 text-ink-primary'
              : keyHighlight
                ? 'bg-search-match border-l-2 border-search-matchBorder pl-1'
                : '',
          ].join(' ')}
        >
          <button
            onClick={() => setOpen((o) => !o)}
            className="mr-1 -ml-4 w-3 text-ink-muted hover:text-ink-primary"
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? '▾' : '▸'}
          </button>
          {name !== null && (
            <>
              <span className={isActiveMatch ? 'text-ink-primary font-semibold' : 'text-accent-key'}>
                {query && searchMatch?.matchesKey ? (
                  <HighlightText
                    text={typeof name === 'number' ? String(name) : `"${name}"`}
                    query={query!}
                    caseSensitive={caseSensitive ?? false}
                    activeRow={isActiveMatch}
                  />
                ) : (
                  typeof name === 'number' ? name : `"${name}"`
                )}
              </span>
              <span className="text-ink-muted mx-1">:</span>
            </>
          )}
          <span className="text-ink-secondary">{open_br}</span>
          {!open && (
            <span className="ml-2 text-ink-muted text-[11px] uppercase tracking-wider">
              {entries.length} {entries.length === 1 ? 'item' : 'items'}
            </span>
          )}
          {!open && (
            <span className="text-ink-secondary">
              {close_br}{trailingComma ? ',' : ''}
            </span>
          )}
        </div>
        {open && (
          <>
            {entries.map(([k, v], idx) => (
              <Node
                key={String(k)}
                name={k as string | number}
                value={v}
                path={
                  kind === 'array'
                    ? `${path}[${k}]`
                    : path === ''
                      ? String(k)
                      : `${path}.${String(k)}`
                }
                depth={depth + 1}
                trailingComma={idx < entries.length - 1}
                {...childProps}
              />
            ))}
            <div style={{ paddingLeft: `${depth * 16}px` }} className="text-ink-secondary">
              {close_br}{trailingComma ? ',' : ''}
            </div>
          </>
        )}
      </div>
    );
  }

  // Primitive row.
  return (
    <div className={[hlClass, 'group flex items-center'].join(' ')} style={indent}>
      <div
        className={[
          'flex flex-1 items-center rounded-sm',
          isActiveMatch
            ? 'bg-search-active border-l-2 border-search-activeBorder pl-1'
            : searchMatch
              ? 'bg-search-match border-l-2 border-search-matchBorder pl-1'
              : '',
        ].join(' ')}
      >
        {name !== null && (
          <>
            <span className={isActiveMatch ? 'text-ink-primary font-semibold' : 'text-accent-key'}>
              {query && searchMatch?.matchesKey ? (
                <HighlightText
                  text={typeof name === 'number' ? String(name) : `"${name}"`}
                  query={query!}
                  caseSensitive={caseSensitive ?? false}
                  activeRow={isActiveMatch}
                />
              ) : (
                typeof name === 'number' ? name : `"${name}"`
              )}
            </span>
            <span className="text-ink-muted mx-1">:</span>
          </>
        )}
        <PrimitiveValue
          value={value}
          query={query}
          caseSensitive={caseSensitive}
          matchesValue={searchMatch?.matchesValue}
          activeRow={isActiveMatch}
        />
        {trailingComma && <span className="text-ink-muted">,</span>}
      </div>
      <CopyButton value={value} />
    </div>
  );
}

function PrimitiveValue({
  value,
  query,
  caseSensitive,
  matchesValue,
  activeRow,
}: {
  value: unknown;
  query?: string;
  caseSensitive?: boolean;
  matchesValue?: boolean;
  activeRow?: boolean;
}) {
  const rawText =
    value === null
      ? 'null'
      : typeof value === 'string'
        ? `"${value}"`
        : String(value);

  // On active rows, force ink-primary so the value is readable against the
  // saturated gold background. Accent colors stay on non-active rows.
  const colorClass = activeRow
    ? 'text-ink-primary font-semibold'
    : value === null
      ? 'text-accent-bool'
      : typeof value === 'string'
        ? 'text-accent-string'
        : typeof value === 'number'
          ? 'text-accent-number'
          : typeof value === 'boolean'
            ? 'text-accent-bool'
            : '';

  if (query && matchesValue) {
    return (
      <span className={colorClass}>
        <HighlightText text={rawText} query={query} caseSensitive={caseSensitive ?? false} activeRow={activeRow} />
      </span>
    );
  }

  return <span className={colorClass}>{rawText}</span>;
}

function CopyButton({ value }: { value: unknown }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(() => {
    const text =
      value === null
        ? 'null'
        : typeof value === 'string'
          ? value
          : String(value);

    navigator.clipboard.writeText(text).catch(() => {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });

    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1500);
  }, [value]);

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy value"
      className="ml-2 opacity-0 group-hover:opacity-100 text-ink-muted hover:text-ink-primary transition-opacity"
    >
      {copied ? (
        // Check icon
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width={13} height={13}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      ) : (
        // Clipboard icon
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={13} height={13}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
        </svg>
      )}
    </button>
  );
}

function HighlightText({
  text,
  query,
  caseSensitive,
  activeRow,
}: {
  text: string;
  query: string;
  caseSensitive: boolean;
  activeRow?: boolean;
}) {
  const norm = (s: string) => (caseSensitive ? s : s.toLowerCase());
  const q = caseSensitive ? query : query.toLowerCase();
  const t = norm(text);

  // On active rows, the row already has a saturated background — use a solid
  // gold fill with dark text for strong letter-level contrast. On non-active
  // rows, the row background is barely tinted, so an underline reads better.
  const markClass = activeRow
    ? 'bg-accent-string text-bg-base rounded-[2px] px-[1px]'
    : 'bg-transparent text-inherit underline decoration-2 decoration-accent-string';

  const parts: ReactNode[] = [];
  let last = 0;
  let idx = t.indexOf(q, last);

  while (idx !== -1) {
    if (idx > last) parts.push(text.slice(last, idx));
    parts.push(
      <mark key={idx} className={markClass}>
        {text.slice(idx, idx + query.length)}
      </mark>
    );
    last = idx + query.length;
    idx = t.indexOf(q, last);
  }

  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
