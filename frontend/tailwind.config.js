/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      /* ── Brand colors ──────────────────────────────────────────────────── */
      colors: {
        primary: '#0284c7',   // sky-600 — kept for existing btn-primary usage
        danger:  '#e02424',
        warning: '#ff5a1f',
        safe:    '#057a55',
        water: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },

      /* ── Typography ────────────────────────────────────────────────────── */
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },

      /* ── Custom keyframes (used in index.css too) ──────────────────────── */
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(36px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '0% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        floatOrb: {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '40%':       { transform: 'translateY(-22px) scale(1.04)' },
          '70%':       { transform: 'translateY(10px) scale(0.97)' },
        },
        waterGradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':       { backgroundPosition: '100% 50%' },
        },
      },

      /* ── Named animations ──────────────────────────────────────────────── */
      animation: {
        'float-orb':     'floatOrb 9s ease-in-out infinite',
        'water-gradient':'waterGradient 14s ease infinite',
        'shimmer':        'shimmer 4s linear infinite',
      },
    },
  },
  plugins: [],
}
