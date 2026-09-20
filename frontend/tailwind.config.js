/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6ff',
          200: '#b8ceff',
          300: '#8babff',
          400: '#5f82ff',
          500: '#3b5cff',
          600: '#2540e6',
          700: '#1c31b4',
          800: '#1a2c8c',
          900: '#1a2a6e'
        }
      }
    }
  },
  plugins: []
};
