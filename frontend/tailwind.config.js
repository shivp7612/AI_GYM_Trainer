/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0B0F19',
          card: '#151D30',
          border: '#23304A',
          muted: '#8F9CAE',
        },
        brand: {
          purple: '#6366F1', // Indigo
          mint: '#10B981', // Emerald
          coral: '#F43F5E', // Rose
          gold: '#F59E0B', // Amber
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
