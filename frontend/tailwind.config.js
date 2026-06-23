/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Atkinson Hyperlegible', 'Arial', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Courier New', 'monospace'],
        dyslexic: ['OpenDyslexic', 'Atkinson Hyperlegible', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
