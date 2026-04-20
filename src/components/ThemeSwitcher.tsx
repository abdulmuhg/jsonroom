import { useEffect, useRef, useState } from 'react';
import type { Theme } from '../hooks/useTheme';
import { THEME_LABELS, THEMES } from '../hooks/useTheme';

interface Props {
  theme: Theme;
  onChange: (theme: Theme) => void;
}

/** Trigger icon — shows a distinct glyph per active theme. */
function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === 'light') {
    // Sun
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" width={14} height={14}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v1.5M12 19.5V21M4.2 4.2l1.06 1.06M18.74 18.74l1.06 1.06M3 12h1.5M19.5 12H21M4.2 19.8l1.06-1.06M18.74 5.26l1.06-1.06M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
        />
      </svg>
    );
  }
  if (theme === 'dark') {
    // Moon
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" width={14} height={14}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.75 15.75A9 9 0 1 1 8.25 2.25a7.5 7.5 0 0 0 13.5 13.5Z"
        />
      </svg>
    );
  }
  // Default — half sun/half moon to signal "signature" theme.
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" width={14} height={14}>
      <circle cx="12" cy="12" r="4.5" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v1.5M12 19.5V21M4.2 4.2l1.06 1.06M18.74 18.74l1.06 1.06M3 12h1.5M19.5 12H21"
      />
    </svg>
  );
}

/** Small preview swatch for each theme in the popover. */
function ThemeSwatch({ theme }: { theme: Theme }) {
  // Hard-coded mini-previews so the swatch looks right regardless of the
  // currently active theme — using CSS vars here would all render the same.
  const palette =
    theme === 'light'
      ? { bg: '#faf9f5', panel: '#e8e6db', accent: '#7b2589' }
      : theme === 'dark'
        ? { bg: '#262624', panel: '#1f1e1d', accent: '#6fb0a4' }
        : { bg: '#1a1e26', panel: '#22272f', accent: '#e07b4f' };

  return (
    <span
      aria-hidden
      className="flex h-5 w-5 flex-shrink-0 overflow-hidden rounded border border-bg-elev"
      style={{ background: palette.bg }}
    >
      <span className="h-full w-1/2" style={{ background: palette.panel }} />
      <span className="h-full w-1/2" style={{ background: palette.accent }} />
    </span>
  );
}

export function ThemeSwitcher({ theme, onChange }: Props) {
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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Change theme"
        aria-haspopup="menu"
        aria-expanded={open}
        title={`Theme: ${THEME_LABELS[theme]}`}
        className={[
          'flex h-7 w-7 items-center justify-center rounded transition-colors',
          open
            ? 'bg-accent-key/15 text-accent-key'
            : 'text-ink-muted hover:bg-bg-hover hover:text-ink-primary',
        ].join(' ')}
      >
        <ThemeIcon theme={theme} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Theme"
          className="absolute right-0 top-full z-40 mt-1.5 w-40 overflow-hidden rounded-md border border-bg-elev bg-bg-panel shadow-xl"
        >
          {THEMES.map((t) => {
            const active = t === theme;
            return (
              <button
                key={t}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                }}
                className={[
                  'flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors',
                  active
                    ? 'bg-bg-elev text-ink-primary'
                    : 'text-ink-secondary hover:bg-bg-hover hover:text-ink-primary',
                ].join(' ')}
              >
                <ThemeSwatch theme={t} />
                <span className="flex-1">{THEME_LABELS[t]}</span>
                {active && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width={12} height={12} className="text-accent-key">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
