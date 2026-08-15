/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true,
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"DM Sans"',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '18px' }],
        base: ['15px', { lineHeight: '22px' }],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        primary: '#c8eef8',
        secondary: '#06aee9',
        success: '#bbf0c8',
        warning: '#f8ebb0',
        error: '#f5c4c4',
        canvas: '#eef5f8',
        ink: '#123047',
        muted: '#5a7384',
        'success-content': '#0aa10a',
        'warning-content': '#E4A11B',
        'error-content': '#a10a0a',
      },
      borderRadius: {
        DEFAULT: '12px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 2px 10px rgba(18, 48, 71, 0.06)',
        panel: '0 8px 24px rgba(18, 48, 71, 0.08)',
        popup: '0 24px 64px rgba(18, 48, 71, 0.22)',
      },
      aspectRatio: {
        a4: '210 / 297',
        'a4-landscape': '297 / 210',
        dialog: '16 / 10',
        hero: '16 / 9',
      },
    },
  },
  plugins: [],
}
