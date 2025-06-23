/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // ✅ Force l'utilisation de la classe 'dark' uniquement
  theme: {
    extend: {},
  },
  plugins: [],
}