/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      inter: ['Inter', 'system-ui', 'sans-serif'],
    },
    extend: {
      colors: {
        primary: '#1F4D3A',
        'primary-dark': '#163829',
        'primary-light': '#DDEFE5',
        background: '#F7F8F5',
        card: '#FFFFFF',
        text: '#1E1E1E',
        'text-secondary': '#5F6368',
        border: '#E5E7EB',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
      },
      borderRadius: {
        'xl': '12px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
