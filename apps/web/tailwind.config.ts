import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        hermes: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
        terminal: {
          green: '#39ff14',
          amber: '#ffbf00',
          cyan: '#00fff5',
          red: '#ff3131',
          dim: '#6b7280',
        },
        void: {
          50: '#f8fafc',
          100: '#1e293b',
          200: '#1a2332',
          300: '#141c27',
          400: '#0f1620',
          500: '#0b1018',
          600: '#080c12',
          700: '#060a0f',
          800: '#04070b',
          900: '#020408',
          950: '#010204',
        },
      },
      boxShadow: {
        glow: '0 0 60px rgba(234, 179, 8, 0.15)',
        'glow-sm': '0 0 20px rgba(234, 179, 8, 0.1)',
        'glow-amber': '0 0 40px rgba(255, 191, 0, 0.12)',
        'glow-green': '0 0 20px rgba(57, 255, 20, 0.08)',
        'neon': '0 0 5px currentColor, 0 0 20px currentColor',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1s step-end infinite',
        'scanline': 'scanline 8s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
        'matrix-rain': 'matrix-rain 20s linear infinite',
        'typing': 'typing 3.5s steps(40, end)',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%': { opacity: '0.97' },
          '5%': { opacity: '0.95' },
          '10%': { opacity: '0.97' },
          '15%': { opacity: '0.94' },
          '20%': { opacity: '0.98' },
          '100%': { opacity: '0.98' },
        },
        'glow-pulse': {
          '0%': { boxShadow: '0 0 5px rgba(234, 179, 8, 0.1), 0 0 20px rgba(234, 179, 8, 0.05)' },
          '100%': { boxShadow: '0 0 10px rgba(234, 179, 8, 0.2), 0 0 40px rgba(234, 179, 8, 0.1)' },
        },
        'matrix-rain': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 100%' },
        },
        typing: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(234, 179, 8, 0.03) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(234, 179, 8, 0.03) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
    },
  },
  plugins: [],
} satisfies Config;
