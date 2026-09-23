/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Identidade monocromatica: brand-600/700 sao o "preto" de botoes, links e precos.
        brand: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#525252',
          600: '#171717',
          700: '#000000',
          800: '#000000',
          900: '#000000'
        }
      }
    }
  },
  plugins: []
};
