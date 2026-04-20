/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
      extend: {
        colors: {
          brand: {
            50: "#eef4ff",
            100: "#d9e7ff",
            200: "#bcd3ff",
            300: "#8fb3ff",
            400: "#5e8cff",
            500: "#3b6eff",
            600: "#2b53e6",
            700: "#2343bf",
            800: "#223b9a",
            900: "#22367a"
          }
        }
      }
    },
    plugins: []
  };