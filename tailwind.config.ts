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
        // Primary Dark Forest palette
        'forest': {
          DEFAULT: '#2e7d32',
          light:   '#43a047',
          dark:    '#1b5e20',
          deeper:  '#0a2e0c',
        },
        // Accent / supporting
        'earth': {
          DEFAULT: '#5D4037',
          light:   '#795548',
          dark:    '#3E2723',
        },
        'wheat': {
          DEFAULT: '#F2C94C',
          light:   '#F7DC6F',
          dark:    '#D4AC0D',
        },
        'sky': {
          DEFAULT: '#87CEEB',
          light:   '#B0E0F5',
          dark:    '#5BA3C9',
        },
        'leaf':  '#66bb6a',
        'rain':  '#4FC3F7',
        'alert': '#FF6B6B',
        'safe':  '#66bb6a',
        'warn':  '#FFA726',
        // Glass surfaces
        'surface': {
          DEFAULT: 'rgba(46,125,50,0.18)',
          light:   'rgba(67,160,71,0.22)',
          dark:    'rgba(6,38,10,0.80)',
        },
      },
      borderRadius: {
        'leaf':    '20px 4px 20px 4px',
        'leaf-sm': '12px 3px 12px 3px',
        'leaf-lg': '28px 6px 28px 6px',
        'pill':    '9999px',
      },
      fontFamily: {
        'sans':    ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Outfit', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        // Dark Forest body bg
        'nature-gradient': 'linear-gradient(160deg, #06260a 0%, #0a2e0c 40%, #112a13 75%, #06260a 100%)',
        // Card gradients
        'card-gradient':   'linear-gradient(145deg, rgba(46,125,50,0.22) 0%, rgba(6,38,10,0.75) 100%)',
        'card-glow':       'linear-gradient(145deg, rgba(67,160,71,0.18) 0%, rgba(46,125,50,0.08) 100%)',
        // Button gradient
        'btn-primary':     'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)',
        // Misc
        'wheat-gradient':  'linear-gradient(135deg, #D4AC0D 0%, #F2C94C 100%)',
        'hero-glow':       'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(46,125,50,0.35) 0%, transparent 70%)',
      },
      boxShadow: {
        'nature':      '0 4px 28px rgba(45, 102, 95, 0.40)',
        'nature-lg':   '0 8px 48px rgba(45, 102, 95, 0.50)',
        'card':        '0 8px 32px rgba(0,0,0,0.35)',
        'card-hover':  '0 12px 48px rgba(0,0,0,0.50)',
        'glow-teal':   '0 0 24px rgba(45, 102, 95, 0.60)',
        'glow-wheat':  '0 0 20px rgba(242, 201, 76, 0.50)',
        'inset-teal':  'inset 0 0 20px rgba(45, 102, 95, 0.15)',
      },
      backdropBlur: {
        'xs': '4px',
        'glass': '16px',
        'glass-lg': '24px',
      },
      animation: {
        'sway':        'sway 3s ease-in-out infinite',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':       'float 4s ease-in-out infinite',
        'grow':        'grow 0.5s ease-out forwards',
        'fade-in':     'fadeIn 0.6s ease-out forwards',
        'slide-up':    'slideUp 0.5s ease-out forwards',
        'shimmer':     'shimmer 2s linear infinite',
        'ping-slow':   'ping 2.5s cubic-bezier(0,0,0.2,1) infinite',
      },
      keyframes: {
        sway: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%':      { transform: 'rotate(2deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        grow: {
          '0%':   { transform: 'scaleY(0)', opacity: '0' },
          '100%': { transform: 'scaleY(1)', opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      spacing: {
        'sidebar':    '14rem',   // 224px — md sidebar width
        'sidebar-lg': '16rem',   // 256px — lg sidebar width
      },
    },
  },
  plugins: [],
}

export default config
