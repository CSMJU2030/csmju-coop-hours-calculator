import type { Config } from 'tailwindcss';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const csmjuPreset = require('./styles/csmju/tailwind-preset.js');

const config: Config = {
  presets: [csmjuPreset],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#e6f2ff',
          100: '#d3e7fc',
          200: '#93c5fd',
          300: '#6aa6e6',
          400: '#3d82cc',
          500: '#1f66b0',
          600: '#004c99',
          700: '#003d7a',
          800: '#002e5c',
          900: '#001f3d',
        },
        indigo: {
          50: '#e6f2ff',
          100: '#d3e7fc',
          200: '#93c5fd',
          300: '#6aa6e6',
          400: '#3d82cc',
          500: '#1f66b0',
          600: '#004c99',
          700: '#003d7a',
          800: '#002e5c',
          900: '#001f3d',
        },
        // CSMJU2030 design tokens — see @csmju2030/design-system
        primary: {
          DEFAULT: '#004c99', // --csmju-color-primary
          dark: '#003d7a',
          light: '#1f66b0',
        },
        secondary: '#E6F2FF',
        neutral: '#334155',
        surface: '#F8FAFC',
        success: '#0F8A5F',
        warning: '#B45309',
        danger: '#B42318',
      },
      fontFamily: {
        thai: ['var(--csmju-font-body)'],
        sans: ['var(--csmju-font-body)'],
        heading: ['var(--csmju-font-heading)'],
      },
      fontSize: {
        base: ['14px', { lineHeight: '1.6' }],
      },
      borderRadius: {
        card: '0.75rem',
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'button': '0 4px 12px -2px rgba(0, 76, 153, 0.25)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #004c99 0%, #003d7a 100%)',
        'gradient-coop': 'linear-gradient(135deg, #004C99 0%, #0F8A5F 100%)',
        'gradient-volunteer': 'linear-gradient(135deg, #0F8A5F 0%, #10B981 100%)',
        'gradient-surface': 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'crawlUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        crawlUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};

export default config;