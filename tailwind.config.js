/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAF3E3',
        ink: '#18181A',
        ink2: '#6B6B70',
        muted: '#9C9CA3',
        yellow: '#F5C518',
        copper: '#C85A3A',
        green: '#2D9E6B',
        card: '#FFFFFF',
        line: '#EDE8DD',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        serif: ['Lora', 'serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(24,24,26,0.06), 0 1px 2px -1px rgba(24,24,26,0.04)',
        'card-md': '0 4px 12px 0 rgba(24,24,26,0.08), 0 2px 4px -2px rgba(24,24,26,0.05)',
        'card-lg': '0 8px 24px 0 rgba(24,24,26,0.10), 0 4px 8px -4px rgba(24,24,26,0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
