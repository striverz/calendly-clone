/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        calendly: {
          blue: '#006BFF',
          'blue-dark': '#0056CC',
          'blue-light': '#E8F0FF',
        },
      },
    },
  },
  plugins: [],
}
