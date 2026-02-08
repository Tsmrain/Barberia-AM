/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './store/**/*.{js,ts,jsx,tsx,mdx}',
        './lib/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
                serif: ['Playfair Display', 'Georgia', 'serif'],
            },
            colors: {
                background: '#0a0a0a',
                foreground: '#ffffff',
                accent: {
                    DEFAULT: '#f59e0b',
                    hover: '#fbbf24',
                },
            },
        },
    },
    plugins: [],
};
