/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { 
    extend: {
      colors: {
        ti9: {
          dark: '#1a0b2e',     // Глубокий фиолетовый фон
          panel: '#2d1752',    // Панели
          accent: '#d4af37',   // Золотой (кнопки, акценты)
          teal: '#00d8b4',     // Бирюзовый (успех, рейтинги)
          light: '#f0e6d2'     // Светлый текст
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        cinzel: ['Cinzel', 'serif'],
        vibes: ['Great Vibes', 'cursive'],
      }
    } 
  },
  plugins: [],
}