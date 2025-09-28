module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        purple: {
          50:  '#eff6ff',   // blue-50
          400: '#60a5fa',   // blue-400
          500: '#3b82f6',   // blue-500
          600: '#2563eb',   // blue-600
          700: '#1d4ed8',   // blue-700
          900: '#1e3a8a',   // blue-900
        },
      },
    },
  },
  plugins: [],
}
