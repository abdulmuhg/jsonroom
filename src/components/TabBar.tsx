import type { Tab } from '../hooks/useTabs';

interface Props {
  tabs: Tab[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onAdd: () => void;
}

export function TabBar({ tabs, activeId, onSelect, onClose, onAdd }: Props) {
  return (
    <div className="flex items-center gap-1 border-b border-bg-elev bg-bg-panel px-2 py-1 overflow-x-auto scrollbar-thin">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={
              'group flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ' +
              (active
                ? 'bg-bg-elev text-ink-primary'
                : 'text-ink-secondary hover:bg-bg-hover hover:text-ink-primary')
            }
          >
            <span className="truncate max-w-[160px]">{tab.name}</span>
            {tab.mode === 'compare' && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-accent-key">
                diff
              </span>
            )}
            <span
              role="button"
              aria-label="Close tab"
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.id);
              }}
              className="ml-1 h-4 w-4 flex items-center justify-center rounded text-ink-muted opacity-0 group-hover:opacity-100 hover:bg-bg-hover hover:text-ink-primary"
            >
              ×
            </span>
          </button>
        );
      })}
      <button
        onClick={onAdd}
        className="ml-1 rounded-md px-3 py-1.5 text-sm text-ink-muted hover:bg-bg-hover hover:text-ink-primary"
        title="New tab (⌘/Ctrl + T)"
      >
        +
      </button>
    </div>
  );
}
