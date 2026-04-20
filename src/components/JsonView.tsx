import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode, MutableRefObject } from 'react';
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

// Mutable counter shared across all <Row> calls in one render pass.
// Reset to 0 at the top of every JsonView render so line numbers reflect the
// current tree. This works because React renders synchronously top-to-bottom
// in this component tree (no Suspense, no concurrent render splits).
interface LineCounter {
  value: number;
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
  const lineCounter = useRef<LineCounter>({ value: 0 });
  // Reset on every render so numbers stay in sync with the tree.
  lineCounter.current.value = 0;

  // User overrides for per-node open/closed state. A path is absent until the
  // user explicitly toggles it — then we store the new open/closed boolean.
  // Lifting this to the root means any toggle re-renders the whole tree,
  // which is what keeps the mutable line-number counter correct. If we kept
  // `open` as local state inside each Node, only the toggled subtree would
  // re-render — sibling rows would keep their stale line numbers.
  const [userOverrides, setUserOverrides] = useState<Map<string, boolean>>(() => new Map());

  const togglePath = useCallback((path: string, nextOpen: boolean) => {
    setUserOverrides((prev) => {
      const next = new Map(prev);
      next.set(path, nextOpen);
      return next;
    });
  }, []);

  return (
    <div className="font-mono text-[13px] leading-6 scrollbar-thin overflow-auto">
      <Node
        name={null}
        value={value}
        path=""
        depth={0}
        lineCounter={lineCounter.current}
        userOverrides={userOverrides}
        onTogglePath={togglePath}
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

// ---------------------------------------------------------------------------
// Row: every visual line in the tree — opening bracket, primitive, closing
// bracket — is one <Row>. Owns the line-number gutter on the left.
// ---------------------------------------------------------------------------

function Row({
  lineNo,
  hlClass,
  children,
}: {
  lineNo: number;
  hlClass?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex group">
      <div className="w-10 flex-shrink-0 select-none bg-bg-gutter text-right pr-2 text-ink-subtle text-[11px] leading-6">
        {lineNo}
      </div>
      <div className={['flex-1 min-w-0 pl-3 flex items-center', hlClass ?? ''].join(' ')}>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Indent: `depth` spacer spans, each with a left border — the indent guides.
// ---------------------------------------------------------------------------

function Indent({ depth }: { depth: number }) {
  if (depth === 0) return null;
  return (
    <>
      {Array.from({ length: depth }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className="inline-block w-4 flex-shrink-0 border-l border-ink-subtle/30 self-stretch"
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Chevron: slim SVG, rotates 90° when open.
// ---------------------------------------------------------------------------

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      width={10}
      height={10}
      className={['transition-transform', open ? 'rotate-90' : ''].join(' ')}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Node: recursive tree renderer.
// ---------------------------------------------------------------------------

interface NodeProps {
  name: string | number | null;
  value: unknown;
  path: string;
  depth: number;
  lineCounter: LineCounter;
  userOverrides: Map<string, boolean>;
  onTogglePath: (path: string, nextOpen: boolean) => void;
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
  lineCounter,
  userOverrides,
  onTogglePath,
  highlightPaths,
  searchMatches,
  activeMatchPath,
  expandPaths,
  query,
  caseSensitive,
  trailingComma,
}: NodeProps) {
  const kind = typeLabel(value);
  const highlight = highlightPaths?.get(path);
  const searchMatch = searchMatches?.get(path);
  const isActiveMatch = activeMatchPath === path;
  const shouldForceExpand = expandPaths?.has(path);

  // Derive open-state with priority: search-force > user override > default.
  // Default policy: depth < 2 is expanded.
  const userOverride = userOverrides.get(path);
  const defaultOpen = depth < 2;
  const open = shouldForceExpand
    ? true
    : userOverride !== undefined
      ? userOverride
      : defaultOpen;

  const diffClass = useMemo(() => {
    if (!highlight) return '';
    if (highlight === 'added') return 'bg-diff-addBg border-l-2 border-diff-add';
    if (highlight === 'removed') return 'bg-diff-removeBg border-l-2 border-diff-remove';
    return 'bg-diff-changeBg border-l-2 border-diff-change';
  }, [highlight]);

  const searchClass = isActiveMatch
    ? 'bg-search-active border-l-2 border-search-activeBorder'
    : searchMatch
      ? 'bg-search-match border-l-2 border-search-matchBorder'
      : '';

  // Prefer the diff highlight over the search tint visually. If both apply,
  // the diff border "wins" on the left; the search row highlight still shows
  // via the background tint.
  const rowHlClass = [searchClass, diffClass].filter(Boolean).join(' ');

  const childProps = {
    lineCounter,
    userOverrides,
    onTogglePath,
    highlightPaths,
    searchMatches,
    activeMatchPath,
    expandPaths,
    query,
    caseSensitive,
  };

  // Render the key label (unquoted for string keys, [n] for array indices).
  // Returns null when this is the root node (no key).
  const renderKey = () => {
    if (name === null) return null;
    const keyText = typeof name === 'number' ? `[${name}]` : String(name);
    const keyColorClass = isActiveMatch ? 'text-ink-primary font-semibold' : 'text-accent-key';
    return (
      <>
        <span className={keyColorClass}>
          {query && searchMatch?.matchesKey ? (
            <HighlightText
              text={keyText}
              query={query}
              caseSensitive={caseSensitive ?? false}
              activeRow={isActiveMatch}
            />
          ) : (
            keyText
          )}
        </span>
        <span className="text-ink-muted mx-1">:</span>
      </>
    );
  };

  if (kind === 'array' || kind === 'object') {
    const entries =
      kind === 'array'
        ? (value as unknown[]).map((v, i) => [i, v] as const)
        : Object.entries(value as Record<string, unknown>);
    const open_br = kind === 'array' ? '[' : '{';
    const close_br = kind === 'array' ? ']' : '}';

    const openingLineNo = ++lineCounter.value;

    return (
      <>
        <Row lineNo={openingLineNo} hlClass={rowHlClass}>
          <Indent depth={depth} />
          <button
            onClick={() => onTogglePath(path, !open)}
            className="mr-1 flex h-6 w-4 items-center justify-center text-ink-muted hover:text-ink-primary flex-shrink-0"
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            <Chevron open={open} />
          </button>
          {renderKey()}
          <span className="text-ink-secondary">{open_br}</span>
          {!open && (
            <>
              <span className="ml-2 text-ink-muted text-[11px]">
                {entries.length} {entries.length === 1 ? 'item' : 'items'}
              </span>
              <span className="text-ink-secondary ml-1">
                {close_br}
                {trailingComma ? ',' : ''}
              </span>
            </>
          )}
          <CopyButton value={value} block />
        </Row>
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
            <Row lineNo={++lineCounter.value} hlClass={diffClass}>
              <Indent depth={depth} />
              <span className="text-ink-secondary ml-5">
                {close_br}
                {trailingComma ? ',' : ''}
              </span>
            </Row>
          </>
        )}
      </>
    );
  }

  // Primitive row.
  const primitiveLineNo = ++lineCounter.value;
  return (
    <Row lineNo={primitiveLineNo} hlClass={rowHlClass}>
      <Indent depth={depth} />
      <span className="mr-1 w-4 flex-shrink-0" aria-hidden />
      {renderKey()}
      <PrimitiveValue
        value={value}
        query={query}
        caseSensitive={caseSensitive}
        matchesValue={searchMatch?.matchesValue}
        activeRow={isActiveMatch}
      />
      <CopyButton value={value} />
      {trailingComma && <span className="text-ink-muted">,</span>}
    </Row>
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

function CopyButton({ value, block }: { value: unknown; block?: boolean }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null> = useRef(null);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const text =
        block || typeof value === 'object'
          ? JSON.stringify(value, null, 2)
          : value === null
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
    },
    [value, block],
  );

  return (
    <button
      onClick={handleCopy}
      aria-label={block ? 'Copy block' : 'Copy value'}
      title={block ? 'Copy block' : 'Copy value'}
      className="ml-2 opacity-0 group-hover:opacity-100 text-ink-muted hover:text-ink-primary transition-opacity flex-shrink-0"
    >
      {copied ? (
        // Check icon
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width={12} height={12}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      ) : (
        // Clipboard icon
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={12} height={12}>
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
