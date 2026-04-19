/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // UI chrome — cool blue-gray neutrals (JSON.site-inspired).
        bg: {
          base: '#1a1e26',      // outer canvas, deeper cool gray
          panel: '#22272f',     // pane / toolbar background
          elev: '#2c323b',      // borders, elevated chips
          hover: '#343a44',     // button hover
          gutter: '#1e232b',    // line-number gutter bg
        },
        ink: {
          primary: '#d8dde5',   // body text — slightly cooler than before
          secondary: '#a8b0bc', // secondary labels
          muted: '#7a8390',     // metadata, keys in muted state
          subtle: '#4e5662',    // placeholder, line numbers, indent guides
        },
        accent: {
          key: '#E07B4F',      // orange — JSON keys
          string: '#E8C07D',   // gold — strings
          number: '#9CDCFE',   // cool blue — numbers
          bool: '#D47B7B',     // coral — booleans/null
        },
        diff: {
          add: '#4A7C59',
          addBg: 'rgba(74, 124, 89, 0.18)',
          remove: '#8B4949',
          removeBg: 'rgba(139, 73, 73, 0.18)',
          change: '#B8864A',
          changeBg: 'rgba(184, 134, 74, 0.18)',
        },
        search: {
          // Non-active matches: visible but subtle gold tint.
          match: 'rgba(232, 192, 125, 0.18)',
          matchBorder: 'rgba(232, 192, 125, 0.45)',
          // Active match: darker, saturated background so JSON text stays readable.
          active: 'rgba(140, 95, 30, 0.55)',
          activeBorder: '#E8C07D',
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
