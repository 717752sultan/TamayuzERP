/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Tajawal', 'sans-serif'] },
      colors: { brand: { 50:'#fdf3f3', 100:'#fbe5e5', 600:'#9b1c1c', 700:'#7f1d1d', 800:'#651919', 900:'#4b1212' } },
      boxShadow: { soft: '0 8px 30px rgba(15,23,42,.06)' }
    }
  },
  plugins: []
}
