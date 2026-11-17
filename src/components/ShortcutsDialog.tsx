import { useEffect } from 'react';
import { SHORTCUTS, type Shortcut, type ShortcutGroup } from '../lib/shortcuts';

interface Props {
  onClose: () => void;
}

const GROUP_ORDER: ShortcutGroup[] = ['Tabs', 'View', 'Edit', 'Help'];

/** Cheat sheet of every keyboard shortcut, built from the SHORTCUTS table. */
export function ShortcutsDialog({ onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const entries = Object.entries(SHORTCUTS) as [Shortcut, (typeof SHORTCUTS)[Shortcut]][];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="max-h-full w-full max-w-md overflow-y-auto rounded-lg border border-bg-elev bg-bg-panel shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-bg-elev px-4 py-3">
          <h2 className="text-sm font-semibold text-ink-primary">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded text-ink-muted transition-colors hover:bg-bg-hover hover:text-ink-primary"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4 px-4 py-3">
          {GROUP_ORDER.map((group) => (
            <section key={group}>
              <h3 className="mb-1 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-subtle">
                {group}
              </h3>
              <ul>
                {entries
                  .filter(([, info]) => info.group === group)
                  .map(([id, info]) => (
                    <li key={id} className="flex items-center justify-between gap-4 py-1.5 text-xs">
                      <span className="text-ink-secondary">{info.description}</span>
                      <kbd className="flex-shrink-0 whitespace-nowrap rounded border border-bg-elev bg-bg-base px-1.5 py-0.5 font-mono text-[11px] text-ink-primary">
                        {info.label}
                      </kbd>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
          <p className="text-[11px] text-ink-muted">
            Except ⌘/Ctrl + F and ⌘/Ctrl + D, shortcuts pause while you type in a text field. On
            Mac, Alt is Option.
          </p>
        </div>
      </div>
    </div>
  );
}
