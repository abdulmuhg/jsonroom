import { useMemo } from 'react';
import { approximateSize, countKeys, parseJson } from '../lib/parseJson';
import { JsonView } from './JsonView';
import { SearchBar } from './SearchBar';
import { useSearch } from '../hooks/useSearch';
import type { DiffEntry } from '../lib/diff';
import type { SearchMatch } from '../hooks/useSearch';

interface Props {
  label: string;
  raw: string;
  onChange: (raw: string) => void;
  diffEntries?: DiffEntry[];
  diffSide?: 'left' | 'right';
  // Compare controls live in the left/single pane only (showCompareButton=true).
  showCompareButton?: boolean;
  isCompareMode?: boolean;
  onToggleCompare?: () => void;
  diffCount?: number;
}

export function Pane({
  label,
  raw,
  onChange,
  diffEntries,
  diffSide,
  showCompareButton,
  isCompareMode,
  onToggleCompare,
  diffCount,
}: Props) {
  const parsed = useMemo(() => parseJson(raw), [raw]);

  const search = useSearch(parsed.ok ? parsed.value : null);

  const highlightPaths = useMemo(() => {
    if (!diffEntries) return undefined;
    const map = new Map<string, 'added' | 'removed' | 'changed'>();
    for (const e of diffEntries) {
      if (diffSide === 'left' && e.kind === 'added') continue;
      if (diffSide === 'right' && e.kind === 'removed') continue;
      map.set(e.path, e.kind);
    }
    return map;
  }, [diffEntries, diffSide]);

  const searchMatchMap = useMemo(() => {
    const map = new Map<string, SearchMatch>();
    for (const m of search.matches) map.set(m.path, m);
    return map;
  }, [search.matches]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Pane header */}
      <div className="flex items-center justify-between border-b border-bg-elev bg-bg-panel px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
            {label}
          </span>
          {parsed.ok && (
            <span className="text-[11px] text-ink-muted font-mono">
              {countKeys(parsed.value)} keys · {approximateSize(raw)}
              {parsed.unescapedLevels > 0 && (
                <span className="ml-2 text-accent-key">
                  unescaped ×{parsed.unescapedLevels}
                </span>
              )}
              {isCompareMode && typeof diffCount === 'number' && (
                <span className="ml-2 text-ink-muted">
                  · {diffCount === 0 ? 'no diff' : `${diffCount} diff${diffCount === 1 ? '' : 's'}`}
                </span>
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Search button */}
          <button
            onClick={search.isOpen ? search.close : search.open}
            aria-label="Search"
            title="Search (⌘/Ctrl + F)"
            className={[
              'flex h-7 w-7 items-center justify-center rounded transition-colors',
              search.isOpen
                ? 'bg-accent-key/15 text-accent-key'
                : 'text-ink-muted hover:bg-bg-hover hover:text-ink-primary',
            ].join(' ')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" width={14} height={14}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
          {/* Format button (three horizontal lines — list-bullet style, reads as "tidy") */}
          <button
            onClick={() => {
              if (parsed.ok) onChange(JSON.stringify(parsed.value, null, 2));
            }}
            disabled={!parsed.ok}
            aria-label="Format"
            title="Format JSON"
            className="flex h-7 w-7 items-center justify-center rounded text-ink-muted transition-colors hover:bg-bg-hover hover:text-ink-primary disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-muted"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" width={14} height={14}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          {/* Clear button (trash icon) */}
          <button
            onClick={() => onChange('')}
            aria-label="Clear"
            title="Clear pane"
            className="flex h-7 w-7 items-center justify-center rounded text-ink-muted transition-colors hover:bg-bg-hover hover:text-ink-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" width={14} height={14}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
          {showCompareButton && onToggleCompare && (
            <button
              onClick={onToggleCompare}
              aria-label="Compare"
              title="Toggle compare mode (⌘/Ctrl + D)"
              className={[
                'flex h-7 w-7 items-center justify-center rounded transition-colors',
                isCompareMode
                  ? 'bg-accent-key/15 text-accent-key'
                  : 'text-ink-muted hover:bg-bg-hover hover:text-ink-primary',
              ].join(' ')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" width={14} height={14}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search bar */}
      {search.isOpen && (
        <SearchBar
          query={search.query}
          onQueryChange={search.setQuery}
          caseSensitive={search.caseSensitive}
          onToggleCase={() => search.setCaseSensitive(!search.caseSensitive)}
          matchCount={search.matches.length}
          activeIndex={search.activeIndex}
          onNext={search.goNext}
          onPrev={search.goPrev}
          onClose={search.close}
        />
      )}

      {/* Content */}
      {raw.trim() === '' ? (
        <textarea
          value={raw}
          onChange={(e) => onChange(e.target.value)}
          placeholder="The room is quiet. Paste some JSON to break the silence…  (Grafana logs and escaped strings are auto-cleaned)"
          className="flex-1 resize-none bg-bg-base p-4 font-mono text-[13px] leading-6 text-ink-primary placeholder:text-ink-subtle focus:outline-none scrollbar-thin"
        />
      ) : parsed.ok ? (
        <div className="flex-1 min-h-0 overflow-auto">
          <JsonView
            value={parsed.value}
            highlightPaths={highlightPaths}
            searchMatches={searchMatchMap}
            activeMatchPath={search.activeMatch?.path}
            expandPaths={search.expandPaths}
            query={search.query}
            caseSensitive={search.caseSensitive}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="border-b border-diff-remove bg-diff-removeBg px-4 py-2 text-sm text-diff-remove">
            <span className="font-semibold">Parse error:</span> {parsed.error}
          </div>
          <textarea
            value={raw}
            onChange={(e) => onChange(e.target.value)}
            className="h-full w-full resize-none bg-bg-base p-4 font-mono text-[13px] leading-6 text-ink-primary focus:outline-none scrollbar-thin"
          />
        </div>
      )}
    </div>
  );
}
