import type { Tab } from '../hooks/useTabs';

interface Props {
  tab: Tab;
  diffCount: number;
  onToggleMode: () => void;
  onRename: (name: string) => void;
}

export function Toolbar({ tab, diffCount, onToggleMode, onRename }: Props) {
  return (
    <div className="flex items-center justify-between border-b border-bg-elev bg-bg-panel px-4 py-2">
      <input
        value={tab.name}
        onChange={(e) => onRename(e.target.value)}
        className="bg-transparent text-sm font-medium text-ink-primary focus:outline-none w-48"
      />
      <div className="flex items-center gap-3">
        {tab.mode === 'compare' && (
          <span className="text-xs font-mono text-ink-muted">
            {diffCount === 0 ? 'No differences' : `${diffCount} difference${diffCount === 1 ? '' : 's'}`}
          </span>
        )}
        <button
          onClick={onToggleMode}
          className={
            'rounded px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ' +
            (tab.mode === 'compare'
              ? 'bg-accent-key text-bg-base'
              : 'bg-bg-elev text-ink-secondary hover:bg-bg-hover hover:text-ink-primary')
          }
          title="Toggle compare mode (⌘/Ctrl + D)"
        >
          Compare
        </button>
      </div>
    </div>
  );
}
