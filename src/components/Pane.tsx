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
            title="Search"
            className={[
              'rounded border border-bg-elev px-2 py-1 transition-colors',
              search.isOpen
                ? 'bg-accent-key/20 text-accent-key border-accent-key/30'
                : 'text-ink-muted hover:bg-bg-hover hover:text-ink-primary',
            ].join(' ')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={14} height={14}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
          <button
            onClick={() => {
              if (parsed.ok) onChange(JSON.stringify(parsed.value, null, 2));
            }}
            disabled={!parsed.ok}
            className="rounded border border-bg-elev px-2 py-1 text-[12px] text-ink-muted hover:bg-bg-hover hover:text-ink-primary disabled:opacity-40"
          >
            Format
          </button>
          <button
            onClick={() => onChange('')}
            className="rounded border border-bg-elev px-2 py-1 text-[12px] text-ink-muted hover:bg-bg-hover hover:text-ink-primary"
          >
            Clear
          </button>
          {showCompareButton && onToggleCompare && (
            <button
              onClick={onToggleCompare}
              title="Toggle compare mode (⌘/Ctrl + D)"
              className={[
                'rounded border px-2 py-1 text-[12px] font-semibold uppercase tracking-wider transition-colors',
                isCompareMode
                  ? 'border-accent-key/30 bg-accent-key/20 text-accent-key'
                  : 'border-bg-elev text-ink-muted hover:bg-bg-hover hover:text-ink-primary',
              ].join(' ')}
            >
              Compare
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
