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
          black: '#090A0E',
          surface: '#11131A',
          card: '#161922',
          border: '#232733',
          muted: '#8E95A8',
          gold: '#D4AF37',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 18px -6px rgba(212, 175, 55, 0.28)',
        'card-glow': '0 10px 30px rgba(0, 0, 0, 0.35)',
      }
    },
  },
  plugins: [],
};
