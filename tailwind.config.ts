import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        sans:    ['"Inter"', 'sans-serif'],
        body:    ['"Inter"', 'sans-serif'],
      },
      fontSize: {
        'display-2xl': ['72px', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '600' }],
        'display-xl':  ['60px', { lineHeight: '1.08', letterSpacing: '-0.03em', fontWeight: '600' }],
        'display-lg':  ['48px', { lineHeight: '1.10', letterSpacing: '-0.025em', fontWeight: '600' }],
        'display-md':  ['36px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-sm':  ['28px', { lineHeight: '1.20', letterSpacing: '-0.02em', fontWeight: '600' }],
      },
      colors: {
        background: '#09090B',
        surface: {
          1: 'rgba(255,255,255,0.03)',
          2: 'rgba(255,255,255,0.06)',
          3: 'rgba(255,255,255,0.10)',
        },
        border: {
          subtle:  'rgba(255,255,255,0.08)',
          default: 'rgba(255,255,255,0.12)',
          strong:  'rgba(255,255,255,0.20)',
        },
        text: {
          primary:   'rgba(255,255,255,1.00)',
          secondary: 'rgba(255,255,255,0.55)',
          tertiary:  'rgba(255,255,255,0.30)',
          disabled:  'rgba(255,255,255,0.18)',
        },
        zinc: {
          850: '#111113',
          950: '#09090B',
        }
      },
      borderRadius: {
        lg:   'var(--radius)',
        md:   'calc(var(--radius) - 2px)',
        sm:   'calc(var(--radius) - 4px)',
        full: '9999px',
      },
      boxShadow: {
        'glow-white':    '0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.6)',
        'glow-white-lg': '0 0 0 1px rgba(255,255,255,0.12), 0 16px 64px rgba(0,0,0,0.7)',
        'card':          '0 1px 3px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.4)',
        'card-hover':    '0 4px 24px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.5)',
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease-out forwards',
        'slide-up':  'slideUp 0.5s ease-out forwards',
        'scale-in':  'scaleIn 0.3s ease-out forwards',
        'live-pulse': 'livePulse 1.8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        livePulse: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(34,197,94,0.6)' },
          '50%':      { opacity: '0.8', boxShadow: '0 0 0 5px rgba(34,197,94,0)' },
        },
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
