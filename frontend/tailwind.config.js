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
          DEFAULT: '#050508', // Pitch Obsidian Black
          card: '#0E0E17',    // Deep Obsidian Glass
          border: '#1F1F2E',  // Dark Slate Border
          muted: '#8E8EA8',   // Cool Slate Muted
        },
        gold: {
          DEFAULT: '#D99B26', // Warm Softer Gold
          light: '#E5B548',   // Soft Champagne Gold
          dark: '#B47B16',    // Muted Bronze Gold
          glow: 'rgba(217, 155, 38, 0.15)',
        },
        red: {
          DEFAULT: '#EF4444', // Crimson Red
          light: '#F87171',   // Bright Red
          dark: '#DC2626',    // Deep Red
          glow: 'rgba(239, 68, 68, 0.25)',
        },
        magenta: {
          DEFAULT: '#EF4444', // Mapped to Red
          light: '#F87171',   
          dark: '#DC2626',    
          glow: 'rgba(239, 68, 68, 0.25)',
        },
        brand: {
          gold: '#F59E0B',
          red: '#EF4444',
          magenta: '#EF4444',
          purple: '#EF4444', // Backward compatibility mapping to Red
          mint: '#10B981',   // Accent mint for success states
          coral: '#EF4444',  // Accent red
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
