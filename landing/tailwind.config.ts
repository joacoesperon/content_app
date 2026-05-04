import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Jess Trading brand
        carbon: {
          DEFAULT: '#101010',
          deep: '#010101',
        },
        neon: {
          DEFAULT: '#45B14F',
          bright: '#A5F28C',
        },
        electric: {
          DEFAULT: '#2979FF',
        },
        ink: {
          primary: '#FFFFFF',
          secondary: '#D7D7D7',
          muted: '#A7A7A7',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'carbon-radial':
          'radial-gradient(ellipse at center, #101010 0%, #050505 60%, #010101 100%)',
      },
      boxShadow: {
        'electric-glow': '0 0 32px rgba(41, 121, 255, 0.35)',
        'neon-glow': '0 0 32px rgba(165, 242, 140, 0.25)',
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out forwards',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
