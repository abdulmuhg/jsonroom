/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // UI chrome — driven by CSS variables so themes can swap them.
        // Variable definitions live in src/styles/index.css.
        bg: {
          base: 'var(--color-bg-base)',
          panel: 'var(--color-bg-panel)',
          elev: 'var(--color-bg-elev)',
          hover: 'var(--color-bg-hover)',
          gutter: 'var(--color-bg-gutter)',
        },
        ink: {
          primary: 'var(--color-ink-primary)',
          secondary: 'var(--color-ink-secondary)',
          muted: 'var(--color-ink-muted)',
          subtle: 'var(--color-ink-subtle)',
        },
        accent: {
          key: 'var(--color-accent-key)',
          string: 'var(--color-accent-string)',
          number: 'var(--color-accent-number)',
          bool: 'var(--color-accent-bool)',
        },
        diff: {
          add: 'var(--color-diff-add)',
          addBg: 'var(--color-diff-add-bg)',
          remove: 'var(--color-diff-remove)',
          removeBg: 'var(--color-diff-remove-bg)',
          change: 'var(--color-diff-change)',
          changeBg: 'var(--color-diff-change-bg)',
        },
        search: {
          match: 'var(--color-search-match)',
          matchBorder: 'var(--color-search-match-border)',
          active: 'var(--color-search-active)',
          activeBorder: 'var(--color-search-active-border)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
