/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        surface: '#F8FAF7',
        card:    '#FFFFFF',
        'tv-primary':   '#17251C',
        'tv-secondary': '#647067',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:       '0 1px 3px 0 rgba(20,83,45,0.07), 0 1px 2px -1px rgba(20,83,45,0.04)',
        'card-lg':  '0 4px 16px 0 rgba(20,83,45,0.10), 0 2px 4px -1px rgba(20,83,45,0.06)',
        glow:       '0 0 0 3px rgba(22,163,74,0.20)',
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease-out',
        'slide-up':  'slideUp 0.4s ease-out',
        'slide-left': 'slideLeft 0.25s ease-out',
        'scale-up':  'scaleUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' },                                           '100%': { opacity: '1' } },
        slideUp:   { '0%': { opacity: '0', transform: 'translateY(16px)' },            '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideLeft: { '0%': { opacity: '0', transform: 'translateX(100%)' },            '100%': { opacity: '1', transform: 'translateX(0)' } },
        scaleUp:   { '0%': { opacity: '0', transform: 'scale(0.95) translateY(8px)' },'100%': { opacity: '1', transform: 'scale(1) translateY(0)' } },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
