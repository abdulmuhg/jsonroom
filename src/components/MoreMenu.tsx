import { useEffect, useRef, useState } from 'react';

interface Props {
  onShowIntro: () => void;
}

/** Overflow menu for rarely used links, so they stay out of the main row. */
export function MoreMenu({ onShowIntro }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const itemClass =
    'flex w-full items-center px-3 py-2 text-left text-xs text-ink-secondary transition-colors hover:bg-bg-hover hover:text-ink-primary';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="More"
        aria-haspopup="menu"
        aria-expanded={open}
        title="More"
        className={[
          'flex h-7 w-7 items-center justify-center rounded transition-colors',
          open
            ? 'bg-accent-key/15 text-accent-key'
            : 'text-ink-muted hover:bg-bg-hover hover:text-ink-primary',
        ].join(' ')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" width={14} height={14}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="More"
          className="absolute right-0 top-full z-40 mt-1.5 w-40 overflow-hidden rounded-md border border-bg-elev bg-bg-panel shadow-xl"
        >
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onShowIntro();
            }}
            className={itemClass}
          >
            Meet Mr. J
          </button>
          <a
            role="menuitem"
            href="https://github.com/abdulmuhg/jsonroom"
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            Contribute on GitHub
          </a>
        </div>
      )}
    </div>
  );
}
