import { useMemo } from 'react';
import { approximateSize, countKeys, parseJson } from '../lib/parseJson';
import { JsonView } from './JsonView';
import type { DiffEntry } from '../lib/diff';

interface Props {
  label: string;
  raw: string;
  onChange: (raw: string) => void;
  diffEntries?: DiffEntry[];
  diffSide?: 'left' | 'right';
}

export function Pane({ label, raw, onChange, diffEntries, diffSide }: Props) {
  const parsed = useMemo(() => parseJson(raw), [raw]);

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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
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
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (parsed.ok) {
                onChange(JSON.stringify(parsed.value, null, 2));
              }
            }}
            disabled={!parsed.ok}
            className="rounded px-2 py-1 text-[11px] text-ink-muted hover:bg-bg-hover hover:text-ink-primary disabled:opacity-40"
          >
            Format
          </button>
          <button
            onClick={() => onChange('')}
            className="rounded px-2 py-1 text-[11px] text-ink-muted hover:bg-bg-hover hover:text-ink-primary"
          >
            Clear
          </button>
        </div>
      </div>

      {raw.trim() === '' ? (
        <textarea
          value={raw}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste JSON here…  (Grafana log lines and escaped strings are auto-cleaned)"
          className="flex-1 resize-none bg-bg-base p-4 font-mono text-[13px] leading-6 text-ink-primary placeholder:text-ink-subtle focus:outline-none scrollbar-thin"
        />
      ) : parsed.ok ? (
        <div className="flex-1 min-h-0 overflow-auto">
          <JsonView value={parsed.value} highlightPaths={highlightPaths} />
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
