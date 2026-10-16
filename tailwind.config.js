/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bridge: {
          50: '#FDF8F5',
          100: '#F9EFE9',
          200: '#F2DCCF',
          300: '#E7BFA8',
          400: '#D89979',
          500: '#C77953',
          600: '#B6613C',
          700: '#974C2F',
          800: '#7B3F29',
          900: '#653525',
        },
        sage: {
          50: '#F4F7F5',
          100: '#E4ECE7',
          200: '#C9D9CF',
          300: '#A4BEAE',
          400: '#7C9E89',
          500: '#5C826A',
          600: '#466752',
          700: '#385242',
          800: '#2E4236',
          900: '#27372E',
        }
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          '"Helvetica Neue"',
          '"Segoe UI"',
          '"Apple SD Gothic Neo"',
          '"Noto Sans KR"',
          '"Malgun Gothic"',
          'sans-serif'
        ]
      }
    },
  },
  plugins: [],
}
