export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: { keyframes: { slide: {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(300%)' },
  } } } },
  plugins: [],
};
