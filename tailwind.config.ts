import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'forest': {
          DEFAULT: '#2D5A27',
          light: '#3E7A36',
          dark: '#1A3317',
        },
        'earth': {
          DEFAULT: '#5D4037',
          light: '#795548',
          dark: '#3E2723',
        },
        'wheat': {
          DEFAULT: '#F2C94C',
          light: '#F7DC6F',
          dark: '#D4AC0D',
        },
        'sky': {
          DEFAULT: '#87CEEB',
          light: '#B0E0F5',
          dark: '#5BA3C9',
        },
        'leaf': '#7CB342',
        'rain': '#4FC3F7',
        'alert': '#FF7043',
        'safe': '#66BB6A',
        'warn': '#FFA726',
      },
      borderRadius: {
        'leaf': '20px 4px 20px 4px',
        'leaf-sm': '12px 3px 12px 3px',
        'leaf-lg': '28px 6px 28px 6px',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Outfit', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'nature-gradient': 'linear-gradient(135deg, #1A3317 0%, #2D5A27 50%, #3E7A36 100%)',
        'earth-gradient': 'linear-gradient(135deg, #3E2723 0%, #5D4037 100%)',
        'wheat-gradient': 'linear-gradient(135deg, #D4AC0D 0%, #F2C94C 100%)',
        'sky-gradient': 'linear-gradient(180deg, #87CEEB 0%, #B0E0F5 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'nature': '0 4px 24px rgba(45, 90, 39, 0.35)',
        'earth': '0 4px 24px rgba(93, 64, 55, 0.35)',
        'wheat': '0 4px 24px rgba(242, 201, 76, 0.35)',
        'card': '0 8px 32px rgba(0,0,0,0.25)',
        'glow-green': '0 0 20px rgba(45, 90, 39, 0.5)',
        'glow-wheat': '0 0 20px rgba(242, 201, 76, 0.5)',
      },
      animation: {
        'sway': 'sway 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'grow': 'grow 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        sway: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        grow: {
          '0%': { transform: 'scaleY(0)', opacity: '0' },
          '100%': { transform: 'scaleY(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
