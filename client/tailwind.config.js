/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Standardized Healthcare Palette Tokens
        background: '#FAF9F7',
        surface: {
          DEFAULT: '#FFFFFF',
          soft: '#FFF7F8',
          subtle: '#F7F7F5',
        },
        rose: {
          50: '#FFF0F2',
          100: '#FFE4E8',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#D92D45',
          700: '#BE123C',
          800: '#8F1D35',
          900: '#6B1225',
          950: '#4C0519',
        },
        brand: {
          DEFAULT: '#D92D45',
          crimson: '#D92D45',
          dark: '#8F1D35',
          soft: '#FFE4E8',
          rose: '#FFF0F2',
          burgundy: '#4C0519',
        },
        text: {
          primary: '#1F2937',
          secondary: '#667085',
          muted: '#9CA3AF',
        },
        border: {
          DEFAULT: '#E7E5E4',
          subtle: '#E7E5E4',
          rose: '#FFE4E8',
        },
        success: {
          DEFAULT: '#15803D',
          50: '#F0FDF4',
          100: '#DCFCE7',
          700: '#15803D',
          800: '#166534',
        },
        warning: {
          DEFAULT: '#B45309',
          50: '#FFFBEB',
          100: '#FEF3C7',
          700: '#B45309',
          800: '#92400E',
        },
        danger: {
          DEFAULT: '#B42318',
          50: '#FEF2F2',
          100: '#FEE2E2',
          700: '#B42318',
          800: '#991B1B',
        },
      },
      borderRadius: {
        'btn': '12px',
        'card': '16px',
        'hero': '24px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 8px 20px -4px rgb(0 0 0 / 0.06), 0 4px 6px -2px rgb(0 0 0 / 0.03)',
        'elevated': '0 12px 24px -4px rgb(0 0 0 / 0.08)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-up': 'slideUp 0.25s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
