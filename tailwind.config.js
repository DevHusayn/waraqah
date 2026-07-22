/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
                brand: ['"Bodoni Moda"', 'Georgia', 'serif'],
            },
            colors: {
                brand: {
                    DEFAULT: 'var(--brand)',
                    hover: 'var(--brand-hover)',
                    light: 'var(--brand-light)',
                    subtle: 'var(--brand-subtle)',
                    secondary: 'var(--brand-secondary)',
                },
                surface: {
                    DEFAULT: 'var(--surface)',
                    muted: 'var(--surface-muted)',
                    elevated: 'var(--surface-elevated)',
                },
                primary: {
                    50: '#F0FDF4',
                    100: '#DCFCE7',
                    200: '#BBF7D0',
                    300: '#86EFAC',
                    400: '#4ADE80',
                    500: '#22C55E',
                    600: '#16A34A',
                    700: '#15803D',
                    800: '#166534',
                    900: '#14532D',
                },
            },
            boxShadow: {
                soft: '0 1px 2px 0 rgb(0 0 0 / 0.03), 0 1px 3px 0 rgb(0 0 0 / 0.04)',
                card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 2px 4px -1px rgb(0 0 0 / 0.03)',
                'card-md': '0 2px 8px -2px rgb(0 0 0 / 0.05), 0 1px 3px -1px rgb(0 0 0 / 0.03)',
                lift: '0 4px 16px -4px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.03)',
            },
            borderRadius: {
                DEFAULT: '0.5rem',
                lg: '0.5rem',
                xl: '0.625rem',
                '2xl': '0.75rem',
            },
            transitionTimingFunction: {
                smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
            },
            animation: {
                'spin-smooth': 'spin-smooth 0.75s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            },
            keyframes: {
                'spin-smooth': {
                    to: { transform: 'rotate(360deg)' },
                },
            },
        },
    },
    plugins: [],
}
