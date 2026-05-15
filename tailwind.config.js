/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // VOID Design System — OLED Mode
        void: {
          black:     '#000000',   // True OLED black
          surface:   'rgba(255, 255, 255, 0.05)', // Frosted glass base
          surfaceHover: 'rgba(255, 255, 255, 0.09)',
          border:    'rgba(255, 255, 255, 0.08)',
          textPrimary:   '#F5F5F7',   // Off-white
          textSecondary: '#8E8E93',   // Space gray
          lent:      '#FF453A',   // Crimson Nebula — money out
          received:  '#32D74B',   // Aurora Green — money in
          lentDim:   'rgba(255, 69, 58, 0.15)',
          receivedDim: 'rgba(50, 215, 75, 0.15)',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        // Fluid typography scale
        'hero':   ['clamp(3rem, 10vw, 5.5rem)', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'title':  ['clamp(1.5rem, 4vw, 2rem)',  { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'head':   ['clamp(1.1rem, 3vw, 1.25rem)', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '500' }],
        'body':   ['0.9375rem', { lineHeight: '1.5' }],
        'caption':['0.8125rem', { lineHeight: '1.4' }],
        'micro':  ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.04em', fontWeight: '500' }],
      },
      backdropBlur: {
        glass: '24px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        'lent-glow':     '0 0 40px rgba(255, 69, 58, 0.18)',
        'received-glow': '0 0 40px rgba(50, 215, 75, 0.18)',
        'dock': '0 -1px 0 rgba(255,255,255,0.06), 0 -20px 60px rgba(0,0,0,0.8)',
      },
      borderRadius: {
        'pill': '999px',
        'glass': '20px',
        'glass-sm': '14px',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      keyframes: {
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'float-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'cursor-blink': 'cursor-blink 1s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'float-up': 'float-up 0.3s ease-out both',
      },
    },
  },
  plugins: [],
};
