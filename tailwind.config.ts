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
        // ── Modern Heritage Palette ──────────────────────────────────────
        // Surfaces (warm bone-based)
        'bone':        '#fafaf4',
        'bone-dim':    '#dadad5',
        'bone-low':    '#f4f4ee',
        'bone-card':   '#eeeee9',
        'bone-high':   '#e8e8e3',
        'bone-highest':'#e3e3de',

        // Text
        'ink':         '#1a1c19',
        'ink-muted':   '#424843',
        'ink-inverse': '#f1f1ec',

        // Borders
        'border-strong': '#727972',
        'border-soft':   '#c2c8c0',

        // Primary: Deep Forest Green
        'forest': {
          DEFAULT: '#163422',
          medium:  '#2d4b37',
          light:   '#adcfb4',
          lighter: '#c8ebd0',
          tint:    '#466550',
          dark:    '#022110',
          muted:   '#2f4d39',
        },

        // Secondary: Burnt Sienna (action color)
        'sienna': {
          DEFAULT: '#994624',
          light:   '#ff956d',
          dark:    '#762c0c',
          pale:    '#ffdbcf',
          medium:  '#ffb59b',
          deep:    '#380d00',
          muted:   '#7b2f0f',
        },

        // Tertiary: Golden Ochre
        'ochre': {
          DEFAULT: '#402a00',
          medium:  '#5d3f00',
          light:   '#e4a73b',
          pale:    '#ffdead',
          gold:    '#fbbb4d',
          deep:    '#281900',
          muted:   '#604100',
        },

        // Semantic
        'safe':  '#5DBD8A',
        'alert': '#ba1a1a',
        'warn':  '#ffa726',
        'info':  '#4FC3F7',
        'alert-container': '#ffdad6',

        // Legacy compat aliases (so existing components don't break)
        'leaf':  '#5DBD8A',
        'rain':  '#4FC3F7',
        'wheat': { DEFAULT: '#e4a73b', light: '#fbbb4d', dark: '#604100' },
      },

      borderRadius: {
        'sm':   '0.25rem',   // 4px — inner elements
        'DEFAULT': '0.5rem', // 8px — buttons, inputs
        'md':   '0.75rem',   // 12px
        'lg':   '1rem',      // 16px
        'xl':   '1.5rem',    // 24px — cards (spec default)
        '2xl':  '2rem',      // 32px — modals
        'full': '9999px',
        // Legacy
        'leaf':    '20px 4px 20px 4px',
        'leaf-sm': '12px 3px 12px 3px',
        'leaf-lg': '28px 6px 28px 6px',
        'pill':    '9999px',
      },

      fontFamily: {
        'sans':    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        'display': ['Newsreader', 'Georgia', 'serif'],
        // Legacy compat
        'body':    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '600' }],
        'headline-lg-mobile': ['28px', { lineHeight: '36px', fontWeight: '600' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '500' }],
        'title-lg':  ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg':   ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md':   ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-md':  ['14px', { lineHeight: '20px', fontWeight: '600', letterSpacing: '0.01em' }],
        'label-sm':  ['12px', { lineHeight: '16px', fontWeight: '700' }],
      },

      boxShadow: {
        // Warm terracotta-tinted ambient shadow (spec)
        'card':       '0 12px 32px -4px rgba(179, 89, 54, 0.08)',
        'card-hover': '0 20px 48px -4px rgba(179, 89, 54, 0.14)',
        'card-sm':    '0 4px 16px -2px rgba(179, 89, 54, 0.06)',
        'modal':      '0 32px 80px -8px rgba(22, 52, 34, 0.18)',
        'btn':        '0 4px 16px rgba(153, 70, 36, 0.25)',
        'btn-hover':  '0 8px 24px rgba(153, 70, 36, 0.35)',
        'forest-glow':'0 0 24px rgba(22, 52, 34, 0.20)',
        // Legacy compat
        'nature':     '0 4px 28px rgba(45, 102, 95, 0.20)',
        'nature-lg':  '0 8px 48px rgba(45, 102, 95, 0.25)',
      },

      backgroundImage: {
        'bone-gradient':  'linear-gradient(160deg, #fafaf4 0%, #f4f4ee 100%)',
        'forest-gradient':'linear-gradient(135deg, #163422 0%, #2d4b37 100%)',
        'sienna-gradient':'linear-gradient(135deg, #994624 0%, #762c0c 100%)',
        'ochre-gradient': 'linear-gradient(135deg, #e4a73b 0%, #fbbb4d 100%)',
        // Bogolanfini pattern placeholder (apply as bg-bogolan)
        'bogolan':        "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%232d4b37' stroke-width='0.5' opacity='0.12'%3E%3Crect x='5' y='5' width='30' height='30'/%3E%3Crect x='10' y='10' width='20' height='20'/%3E%3Cline x1='5' y1='5' x2='35' y2='35'/%3E%3Cline x1='35' y1='5' x2='5' y2='35'/%3E%3C/g%3E%3C/svg%3E\")",
        // Legacy
        'nature-gradient':'linear-gradient(160deg, #061412 0%, #0D2422 40%, #142E2A 75%, #061412 100%)',
      },

      animation: {
        'fade-in':    'fadeIn 0.5s ease-out forwards',
        'slide-up':   'slideUp 0.4s ease-out forwards',
        'shimmer':    'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':      'float 4s ease-in-out infinite',
        'sway':       'sway 3s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        sway: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%':      { transform: 'rotate(2deg)' },
        },
      },

      spacing: {
        'sidebar':    '14rem',
        'sidebar-lg': '16rem',
      },
    },
  },
  plugins: [],
}

export default config
