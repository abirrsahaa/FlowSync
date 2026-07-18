/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '.theme-console'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // App shell — light "precision instrument" theme (dashboard, stages, canvas, report)
        app: {
          bg: 'var(--app-bg)',
          surface: 'var(--app-surface)',
          'surface-muted': 'var(--app-surface-muted)',
          border: 'var(--app-border)',
          'border-strong': 'var(--app-border-strong)',
          ink: 'var(--app-ink)',
          'ink-muted': 'var(--app-ink-muted)',
          navy: 'var(--app-navy)',
          'navy-hover': 'var(--app-navy-hover)',
          gold: 'var(--app-gold)',
          green: 'var(--app-green)',
          red: 'var(--app-red)',
        },
        // Console — dark "mission control" theme (landing, auth)
        console: {
          bg: 'var(--console-bg)',
          surface: 'var(--console-surface)',
          border: 'var(--console-border)',
          ink: 'var(--console-ink)',
          'ink-muted': 'var(--console-ink-muted)',
          mint: 'var(--console-mint)',
          cyan: 'var(--console-cyan)',
          red: 'var(--console-red)',
        },
        // Gate states — used consistently in both themes as a small status dot/pill, never pass/fail
        gate: {
          open: 'var(--gate-open)',
          soft: 'var(--gate-soft)',
          flagged: 'var(--gate-flagged)',
        },
      },
      borderRadius: {
        sharp: '2px',
      },
      boxShadow: {
        'console-glow': '0 0 0 1px var(--console-mint), 0 0 24px -4px var(--console-mint)',
      },
      backgroundImage: {
        'dot-grid': 'radial-gradient(circle, var(--dot-color) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-grid': '20px 20px',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 var(--gate-open)' },
          '50%': { boxShadow: '0 0 0 6px rgba(0,0,0,0)' },
        },
      },
      animation: {
        'glow-pulse': 'glow-pulse 1.4s ease-in-out 2',
      },
    },
  },
  plugins: [],
}
