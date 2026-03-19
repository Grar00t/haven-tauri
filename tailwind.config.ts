import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        haven: {
          // Sovereign dark base
          void:       '#050505',
          base:       '#0a0a0a',
          surface:    '#111111',
          elevated:   '#1a1a1a',
          border:     '#222222',
          muted:      '#2a2a2a',

          // Gold — Sovereignty accent
          gold:       '#d4af37',
          'gold-dim': '#a08828',
          'gold-bright': '#f0cc55',

          // Green — Terminal / alive
          green:      '#00ff41',
          'green-dim': '#00cc33',
          'green-bright': '#33ff66',

          // Text hierarchy
          'text-primary':   '#f0f0f0',
          'text-secondary': '#a0a0a0',
          'text-muted':     '#505050',

          // Status
          error:   '#ff4444',
          warning: '#ffaa00',
          info:    '#4488ff',
          success: '#00ff41',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'Tajawal', 'Noto Sans Arabic', 'sans-serif'],
      },
      animation: {
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'glow-green': 'glowGreen 2s ease-in-out infinite',
        'scan-line': 'scanLine 3s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        glowGreen: {
          '0%, 100%': { textShadow: '0 0 4px #00ff41' },
          '50%': { textShadow: '0 0 12px #00ff41, 0 0 24px #00ff41' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'gold': '0 0 8px rgba(212, 175, 55, 0.3)',
        'gold-lg': '0 0 24px rgba(212, 175, 55, 0.5)',
        'green': '0 0 8px rgba(0, 255, 65, 0.3)',
        'green-lg': '0 0 24px rgba(0, 255, 65, 0.5)',
        'inner-dark': 'inset 0 2px 8px rgba(0,0,0,0.8)',
      },
      backgroundImage: {
        'gradient-haven': 'linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%)',
        'gradient-gold': 'linear-gradient(90deg, #d4af37, #f0cc55, #d4af37)',
        'gradient-green': 'linear-gradient(90deg, #00cc33, #00ff41, #00cc33)',
        'grid-pattern': 'linear-gradient(rgba(212,175,55,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '24px 24px',
      },
    },
  },
  plugins: [],
};

export default config;
