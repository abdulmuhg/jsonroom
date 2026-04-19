/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // JSONPeek presentation-friendly dark palette
        bg: {
          base: '#0E1116',
          panel: '#1A1F28',
          elev: '#232935',
          hover: '#2A3140',
        },
        ink: {
          primary: '#E8EAED',
          secondary: '#B8BDC7',
          muted: '#8B93A0',
          subtle: '#5C6470',
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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
