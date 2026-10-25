/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          light: '#F5E6B3',
          DEFAULT: '#D4AF37',
          dark: '#9A7D1C',
        },
        cinema: {
          black: '#08090C',
          surface: '#0F1117',
          card: '#161922',
          border: '#262A36',
          muted: '#8B92A5',
          gold: '#D4AF37',
        },
        admin: {
          navy: '#0b1120',
          dark: '#0f172a',
          surface: '#1e293b',
          border: '#334155',
          accent: '#38bdf8',
          accentMuted: '#0284c7'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(212, 175, 55, 0.25)',
        'admin-glow': '0 0 25px -5px rgba(56, 189, 248, 0.2)',
        'card-glow': '0 8px 30px rgba(0, 0, 0, 0.4)',
      }
    },
  },
  plugins: [],
}
