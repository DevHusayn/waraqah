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
                logo: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                brand: {
                    DEFAULT: 'var(--brand)',
                    hover: 'var(--brand-hover)',
                    light: 'var(--brand-light)',
                    subtle: 'var(--brand-subtle)',
                },
                surface: {
                    DEFAULT: 'var(--surface)',
                    muted: 'var(--surface-muted)',
                    elevated: 'var(--surface-elevated)',
                },
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                },
            },
            boxShadow: {
                soft: '0 1px 2px 0 rgb(0 0 0 / 0.03), 0 1px 3px 0 rgb(0 0 0 / 0.04)',
                card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 2px 4px -1px rgb(0 0 0 / 0.03)',
                'card-md': '0 4px 12px -2px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
                lift: '0 8px 24px -4px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.04)',
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
