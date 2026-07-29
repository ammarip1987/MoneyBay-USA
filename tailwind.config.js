/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'mb-dark': '#002f34',
        'mb-blue': '#3d7ebf',
        'mb-cyan': '#23e5db',
        'mb-green': '#28a745',
        'mb-red': '#e53935'
      },
      animation: {
        'blink': 'blink 1s step-start infinite',
      },
      keyframes: {
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' }
        }
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-headings': theme('colors.mb-dark'),
            '--tw-prose-links': theme('colors.mb-blue'),
            '--tw-prose-bold': theme('colors.mb-dark'),
            '--tw-prose-quotes': theme('colors.mb-dark'),
            '--tw-prose-quote-borders': theme('colors.mb-blue'),
            a: {
              textDecoration: 'underline',
              '&:hover': { color: theme('colors.blue.700') }
            },
            code: {
              color: theme('colors.pink.600'),
              backgroundColor: theme('colors.gray.100'),
              padding: '0.125em 0.375em',
              borderRadius: '0.25rem',
              fontWeight: '500'
            },
            'code::before': { content: 'none' },
            'code::after': { content: 'none' }
          }
        }
      })
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}
