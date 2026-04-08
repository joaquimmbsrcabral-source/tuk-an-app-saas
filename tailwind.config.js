export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAF3E3',
        ink: '#18181A',
        ink2: '#5A5048',
        muted: '#9C8E78',
        line: '#E2D4A8',
        yellow: '#F5C518',
        copper: '#C85A3A',
        green: '#2A8A3E',
        card: '#FFFFFF',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        lora: ['Lora', 'serif'],
      },
      borderRadius: {
        card: '20px',
        btn: '14px',
      },
      backgroundColor: {
        base: '#FAF3E3',
      }
    },
  },
  plugins: [],
}
