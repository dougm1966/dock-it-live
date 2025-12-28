/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './public/**/*.html',
    './src/**/*.{js,jsx,ts,tsx,vue}',
  ],
  theme: {
    extend: {
      colors: {
        // Dock-It.live brand colors (to be defined)
        'dock-primary': '#1a73e8',
        'dock-secondary': '#34a853',
        'dock-accent': '#fbbc04',
        'dock-danger': '#ea4335',

        // Legacy PCPL colors (for migration reference)
        'pcpl-dark': '#1a1a1a',
        'pcpl-light': '#f5f5f5',

        // Theme colors (yami, dark, light, etc.)
        'theme-yami-bg': '#0a0e14',
        'theme-yami-text': '#b3b1ad',
        'theme-dark-bg': '#1e1e1e',
        'theme-dark-text': '#d4d4d4',
        'theme-light-bg': '#ffffff',
        'theme-light-text': '#000000',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
        scoreboard: ['Roboto Condensed', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '112': '28rem',
        '128': '32rem',
      },
      screens: {
        'obs-720p': '1280px',
        'obs-1080p': '1920px',
        'obs-1440p': '2560px',
        'obs-4k': '3840px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
