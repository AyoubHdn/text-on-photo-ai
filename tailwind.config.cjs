/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // dark: classes only fire when <html class="dark"> — we never set it
  theme: {
    extend: {
      colors: {
        // Brand primary — warm amber (gift/personalization niche)
        brand: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Warm cream — page and section backgrounds
        cream: {
          50:  '#fdfaf4',
          100: '#faf5e9',
          200: '#f4e9d5',
        },
      },
    },
  },
  plugins: [],
};

module.exports = config;
