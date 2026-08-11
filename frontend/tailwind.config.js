/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './views/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#14201b',
        cream: '#f7f5ef',
        forest: '#246b4a',
        mint: '#d9eee3',
        coral: '#f36f56',
        amber: '#f5b942',
      },
      boxShadow: {
        card: '0 12px 35px rgba(25, 44, 35, 0.08)',
      },
    },
  },
  plugins: [],
};
