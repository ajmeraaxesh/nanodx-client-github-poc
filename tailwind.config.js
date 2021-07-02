// Refer all available tailwind color palettes over here
// https://tailwindcss.com/docs/customizing-colors#color-palette-reference
// const defaultTheme = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')

module.exports = {
  mode: 'jit',
  purge: [
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: false,
  theme: {
    colors: {
      'brand-blue': '#369dd6',
      'brand-dark-blue': '#005d7d',
      'brand-light-gray': '#c1c5c8',
      'brand-light-gray-50': '#f9f9f9',
      'brand-dark-gray': '#898a8d',
      'brand-light-green': '#c9ffd0',
      'brand-green': '#0b7210',
      'brand-light-red': '#ffb9b9',
      'brand-red': '#db2023',
      'brand-light-yellow': '#FEF3C7',
      'brand-yellow': '#F59E0B',

      ...colors,
    },
    fontFamily: {
      tradegothic: ['TradeGothic'],
      'tradegothic-bold': ['TradeGothic-Bold'],
      venera: ['Venera'],
      'montserrat-regular': ['Montserrat-Regular'],
      'montserrat-medium': ['Montserrat-Medium'],
      'montserrat-semibold': ['Montserrat-SemiBold'],
      'montserrat-bold': ['Montserrat-Bold'],
    },
  },

  variants: {},
  plugins: [require('@tailwindcss/forms')],
}
