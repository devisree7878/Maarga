/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        base: {
          950: '#0a0b0f',
          900: '#0e1015',
          850: '#12141b',
          800: '#171a22',
          700: '#20242e',
          600: '#2b3040',
          500: '#3d4356',
          400: '#5b6178',
          300: '#8890a6',
          200: '#b8bece',
          100: '#e4e6ee',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.04), 0 8px 24px -8px rgba(0,0,0,0.5)',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInRight: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        slideInUp: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
      },
      animation: {
        fadeIn: 'fadeIn .2s ease-out',
        slideUp: 'slideUp .25s ease-out',
        slideInRight: 'slideInRight .28s cubic-bezier(.16,1,.3,1)',
        slideInUp: 'slideInUp .28s cubic-bezier(.16,1,.3,1)',
      },
    },
  },
  plugins: [],
}
