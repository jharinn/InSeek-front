/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6eaf2',
          100: '#ccd5e5',
          200: '#99abd0',
          300: '#6681bb',
          400: '#3357a6',
          500: '#00327e',
          600: '#002865',
          700: '#001e4c',
          800: '#001432',
          900: '#000a19',
        },
      },
    },
  },
  plugins: [],
}
