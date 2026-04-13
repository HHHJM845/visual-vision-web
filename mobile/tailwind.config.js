/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#1DA1F2',
        'primary-dark': '#0d8bd9',
        surface: '#F5F7FA',
        card: '#FFFFFF',
        'text-main': '#1A1A2E',
        'text-sub': '#8A8A9A',
      },
    },
  },
  plugins: [],
};
