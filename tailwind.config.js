export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0f172a', // Slate 900
        surface: '#1e293b', // Slate 800
        primary: '#6366f1', // Indigo 500
        secondary: '#0ea5e9', // Sky 500
        accent: '#f43f5e', // Rose 500
        success: '#10b981', // Emerald 500
        warning: '#f59e0b', // Amber 500
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
