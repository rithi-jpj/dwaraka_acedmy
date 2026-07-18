/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { brand: { DEFAULT: '#7c3aed', dark: '#5b21b6' } },
  } },
  plugins: [],
};
