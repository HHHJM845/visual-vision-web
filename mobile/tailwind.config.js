/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './shared/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#007AFF',
        background: '#F2F2F7',
        surface: '#FFFFFF',
        'surface-low': '#F3F4F5',
        'on-surface': '#1C1C1E',
        'on-surface-variant': '#3A3A3C',
        outline: '#E5E5EA',
      },
      fontFamily: {
        headline: ['SpaceGrotesk_700Bold', 'sans-serif'],
        body: ['Manrope_400Regular', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        lg: '16px',
        xl: '20px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
