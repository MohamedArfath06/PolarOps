/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#020817',
          900: '#0a1628',
          800: '#0f2040',
          700: '#162b52',
          600: '#1e3a6e',
          500: '#2a4d8f',
        },
        ice: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        polar: {
          cyan: '#22d3ee',
          blue: '#60a5fa',
          teal: '#2dd4bf',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'polar-gradient': 'linear-gradient(135deg, #020817 0%, #0a1628 50%, #0f2040 100%)',
      }
    },
  },
  plugins: [],
}
