import { useCallback, useEffect, useState } from 'react';

/**
 * Available themes.
 *
 *  - `default` — the original JSONRoom look (cool blue-gray with orange accents)
 *  - `dark`    — Claude-inspired warm stone
 *  - `light`   — Claude-inspired warm cream paper
 */
export type Theme = 'default' | 'dark' | 'light';

export const THEMES: Theme[] = ['default', 'dark', 'light'];

export const THEME_LABELS: Record<Theme, string> = {
  default: 'Default',
  dark: 'Dark',
  light: 'Light',
};

export const THEME_STORAGE_KEY = 'jsonroom.theme.v1';

function isTheme(v: unknown): v is Theme {
  return v === 'default' || v === 'dark' || v === 'light';
}

/** Read the persisted theme, falling back to `default`. */
export function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'default';
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(raw)) return raw;
  } catch {
    // Ignore — localStorage may be disabled (private mode, etc.).
  }
  return 'default';
}

/** Apply a theme to the root element and meta tags. */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);

  // Keep the legacy `dark` class in sync with the active theme so any
  // `dark:` Tailwind utilities (none in use today, but harmless) behave
  // as expected. `default` is a dark theme.
  if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
  }

  // Update the browser chrome color hint for the active background.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const bg = getComputedStyle(root).getPropertyValue('--color-bg-base').trim();
    if (bg) meta.setAttribute('content', bg);
  }
}

/**
 * Theme state hook. Persists to localStorage and applies the theme to the
 * document root whenever it changes.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());

  // Apply on mount and whenever the theme changes.
  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore — persistence is best-effort.
    }
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  return { theme, setTheme };
}
