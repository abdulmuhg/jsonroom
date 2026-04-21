import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode, MutableRefObject } from 'react';
import type { SearchMatch } from '../hooks/useSearch';
import { isMissing } from '../lib/unify';

interface Props {
  value: unknown;
  highlightPaths?: Map<string, 'added' | 'removed' | 'changed'>;
  searchMatches?: Map<string, SearchMatch>;
  activeMatchPath?: string;
  expandPaths?: Set<string>;
  query?: string;
  caseSensitive?: boolean;
  /**
   * When provided, the view becomes "controlled" for per-node expand/collapse
   * state. The parent owns the map and gets notified of toggles. Used by the
   * compare-mode Panes so both sides mirror each other's expand state.
   */
  userOverrides?: Map<string, boolean>;
  onTogglePath?: (path: string, nextOpen: boolean) => void;
}

// ---------------------------------------------------------------------------
// Line-number pre-pass
//
// We compute every row's 1-based line number in a single deterministic walk
// of the parsed value *before* rendering. This is in contrast to a tempting
// mutable-counter-during-render approach, which breaks in two ways:
//   1. A container's closing brace JSX is created before its children are
//      rendered by React, so incrementing in render order gives the closing
//      brace a too-small number.
//   2. React.StrictMode invokes function components twice in dev, so any
//      ref-based counter mutated in render is incremented twice per row.
// Moving the counter out of render removes both footguns.
// ---------------------------------------------------------------------------
interface LineInfo {
  opening: number;
  /** Only present for containers that are open and therefore have their
   *  closing brace on its own row. Closed containers render their brace
   *  inline on the opening row and have no separate closing line. */
  closing?: number;
}

function typeLabel(v: unknown): string {
  if (isMissing(v)) return 'missing';
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

/** Path resolution matches the Node component exactly — keep in sync. */
function childPath(
  parentPath: string,
  key: string | number,
  parentKind: 'array' | 'object',
): string {
  if (parentKind === 'array') return `${parentPath}[${key}]`;
  return parentPath === '' ? String(key) : `${parentPath}.${String(key)}`;
}

function isNodeOpen(
  path: string,
  depth: number,
  userOverrides: Map<string, boolean>,
  expandPaths: Set<string> | undefined,
): boolean {
  if (expandPaths?.has(path)) return true;
  const override = userOverrides.get(path);
  if (override !== undefined) return override;
  return depth < 2; // default policy
}

function computeLineNumbers(
  value: unknown,
  userOverrides: Map<string, boolean>,
  expandPaths: Set<string> | undefined,
): Map<string, LineInfo> {
  const map = new Map<string, LineInfo>();
  const counter = { n: 0 };

  const walk = (v: unknown, path: string, depth: number): void => {
    const kind = typeLabel(v);
    const opening = ++counter.n;

    if (kind === 'array' || kind === 'object') {
      const open = isNodeOpen(path, depth, userOverrides, expandPaths);
      if (open) {
        const entries =
          kind === 'array'
            ? (v as unknown[]).map((x, i) => [i, x] as const)
            : Object.entries(v as Record<string, unknown>);
        map.set(path, { opening });
        for (const [k, cv] of entries) {
          walk(cv, childPath(path, k, kind as 'array' | 'object'), depth + 1);
        }
        const closing = ++counter.n;
        map.set(path, { opening, closing });
      } else {
        // Closed container: just one row with the brace inline.
        map.set(path, { opening });
      }
    } else {
      // Primitive: one row.
      map.set(path, { opening });
    }
  };

  walk(value, '', 0);
  return map;
}

export function JsonView({
  value,
  highlightPaths,
  searchMatches,
  activeMatchPath,
  expandPaths,
  query,
  caseSensitive,
  userOverrides: userOverridesProp,
  onTogglePath: onTogglePathProp,
}: Props) {
  // User overrides for per-node open/closed state. A path is absent until the
  // user explicitly toggles it — then we store the new open/closed boolean.
  // Lifted to the root so any toggle re-renders the whole tree, which is
  // what keeps the line-number map in sync.
  //
  // When `userOverridesProp` / `onTogglePathProp` are provided, the view is
  // "controlled" and delegates to the parent — used by compare-mode Panes so
  // both sides expand/collapse together.
  const [localOverrides, setLocalOverrides] = useState<Map<string, boolean>>(() => new Map());

  const userOverrides = userOverridesProp ?? localOverrides;

  const togglePath = useCallback(
    (path: string, nextOpen: boolean) => {
      if (onTogglePathProp) {
        onTogglePathProp(path, nextOpen);
        return;
      }
      setLocalOverrides((prev) => {
        const next = new Map(prev);
        next.set(path, nextOpen);
        return next;
      });
    },
    [onTogglePathProp],
  );

  const lineNumbers = useMemo(
    () => computeLineNumbers(value, userOverrides, expandPaths),
    [value, userOverrides, expandPaths],
  );

  return (
    <div className="font-mono text-[13px] leading-6 scrollbar-thin overflow-auto">
      <Node
        name={null}
        value={value}
        path=""
        depth={0}
        lineNumbers={lineNumbers}
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
        {lineNo > 0 ? lineNo : ''}
      </div>
      {/* `border-l-2 border-transparent` reserves 2px of space on every row so
       *  diff/search rows (which swap to a colored border) don't cause a 2px
       *  horizontal jitter. Highlight classes only set color now, not width. */}
      <div
        className={[
          'flex-1 min-w-0 pl-3 flex items-center border-l-2 border-transparent',
          hlClass ?? '',
        ].join(' ')}
      >
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
  lineNumbers: Map<string, LineInfo>;
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
  lineNumbers,
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

  // Open-state resolution must match computeLineNumbers exactly, otherwise
  // the pre-pass and the render disagree and children get mis-numbered.
  const open = isNodeOpen(path, depth, userOverrides, expandPaths);

  // Pre-computed line numbers for this path.
  const lineInfo = lineNumbers.get(path);
  const openingLineNo = lineInfo?.opening ?? 0;
  const closingLineNo = lineInfo?.closing ?? openingLineNo;

  const diffClass = useMemo(() => {
    if (!highlight) return '';
    if (highlight === 'added') return 'bg-diff-addBg border-diff-add';
    if (highlight === 'removed') return 'bg-diff-removeBg border-diff-remove';
    return 'bg-diff-changeBg border-diff-change';
  }, [highlight]);

  const searchClass = isActiveMatch
    ? 'bg-search-active border-search-activeBorder'
    : searchMatch
      ? 'bg-search-match border-search-matchBorder'
      : '';

  // Prefer the diff highlight over the search tint visually. If both apply,
  // the diff border "wins" on the left; the search row highlight still shows
  // via the background tint.
  const rowHlClass = [searchClass, diffClass].filter(Boolean).join(' ');

  const childProps = {
    lineNumbers,
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

  // MISSING sentinel — this path exists on the other side of a diff but not
  // here. We render a dim placeholder row so the two panes keep identical row
  // structure and scroll in lock-step. No chevron, no copy button, just the
  // indent guides + key label + a subtle em-dash.
  if (kind === 'missing') {
    return (
      <Row lineNo={openingLineNo} hlClass={rowHlClass}>
        <Indent depth={depth} />
        <span className="mr-1 w-4 flex-shrink-0" aria-hidden />
        {renderKey()}
        <span className="text-ink-subtle/60 italic select-none">—</span>
        {trailingComma && <span className="text-ink-subtle/60">,</span>}
      </Row>
    );
  }

  if (kind === 'array' || kind === 'object') {
    const entries =
      kind === 'array'
        ? (value as unknown[]).map((v, i) => [i, v] as const)
        : Object.entries(value as Record<string, unknown>);
    const open_br = kind === 'array' ? '[' : '{';
    const close_br = kind === 'array' ? ']' : '}';

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
                path={childPath(path, k, kind as 'array' | 'object')}
                depth={depth + 1}
                trailingComma={idx < entries.length - 1}
                {...childProps}
              />
            ))}
            <Row lineNo={closingLineNo} hlClass={diffClass}>
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
  return (
    <Row lineNo={openingLineNo} hlClass={rowHlClass}>
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
  // highlight fill (per-theme search-active-border token) with base-colored
  // text for strong letter-level contrast. On non-active rows, the row
  // background is barely tinted, so an underline reads better.
  const markClass = activeRow
    ? 'bg-search-activeBorder text-bg-base rounded-[2px] px-[1px]'
    : 'bg-transparent text-inherit underline decoration-2 decoration-search-activeBorder';

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
