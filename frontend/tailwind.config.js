/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0F172A',
          secondary: '#111827',
        },
        card: {
          DEFAULT: '#1E293B',
          hover: '#334155',
        },
        primary: {
          DEFAULT: '#4F46E5',
          hover: '#4338CA',
        },
        accent: '#06B6D4',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        text: {
          primary: '#F8FAFC',
          secondary: '#CBD5E1',
          muted: '#94A3B8',
        },
        border: {
          DEFAULT: '#334155',
        }
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
      }
    },
  },
  plugins: [],
}
