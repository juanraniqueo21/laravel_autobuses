/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      // 3. EXTENDER LA FAMILIA DE FUENTES
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Esto reemplaza la fuente por defecto
      },
    },
  },
  plugins: [],
}