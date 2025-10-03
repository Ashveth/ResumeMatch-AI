/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        positive: '#22c55e',
        neutral: '#eab308',
        negative: '#ef4444',
      }
    },
  },
  plugins: [],
}
