/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1a56db',
        danger: '#e02424',
        warning: '#ff5a1f',
        safe: '#057a55',
      },
    },
  },
  plugins: [],
}
