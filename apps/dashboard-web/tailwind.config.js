/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tactical: {
          bg: '#0f172a', // Deep space blue/black
          panel: '#1e293b', // Slightly lighter for cards
          accent: '#0ea5e9', // Cyan/Blue accent
          orange: '#f97316', // Alert orange
          green: '#10b981', // Success green
          border: '#334155', // Slate-700
        }
      },
      fontFamily: {
        sans: ['Rajdhani', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 10px rgba(14, 165, 233, 0.5)',
        'glow-green': '0 0 10px rgba(16, 185, 129, 0.5)',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
      }
    },
  },
  plugins: [],
}


