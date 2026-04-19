import { useEffect, useRef, useState } from 'react';
import type { Tab } from '../hooks/useTabs';

interface Props {
  tabs: Tab[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
}

export function TabBar({ tabs, activeId, onSelect, onClose, onAdd, onRename }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingId]);

  function startEdit(tab: Tab) {
    setEditingId(tab.id);
    setDraft(tab.name);
  }

  function commitEdit() {
    if (editingId === null) return;
    const trimmed = draft.trim();
    if (trimmed.length > 0) {
      const original = tabs.find((t) => t.id === editingId)?.name;
      if (trimmed !== original) onRename(editingId, trimmed);
    }
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  return (
    <div className="flex items-center gap-1 border-b border-bg-elev bg-bg-panel px-2 py-1 overflow-x-auto scrollbar-thin">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        const isEditing = tab.id === editingId;
        return (
          <div
            key={tab.id}
            onClick={() => !isEditing && onSelect(tab.id)}
            onDoubleClick={() => startEdit(tab)}
            className={
              'group flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors cursor-pointer ' +
              (active
                ? 'bg-bg-elev text-ink-primary'
                : 'text-ink-secondary hover:bg-bg-hover hover:text-ink-primary')
            }
            title={isEditing ? undefined : 'Double-click to rename'}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitEdit();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelEdit();
                  }
                }}
                className="bg-transparent text-sm text-ink-primary focus:outline-none border-b border-accent-key/60 max-w-[160px]"
              />
            ) : (
              <span className="truncate max-w-[160px]">{tab.name}</span>
            )}
            {tab.mode === 'compare' && !isEditing && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-accent-key">
                diff
              </span>
            )}
            {!isEditing && (
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
            )}
          </div>
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
