/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Rajdhani', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                display: ['Rajdhani', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
            },
            colors: {
                aegis: {
                    bg: '#020617',
                    surface: '#0f172a',
                    surface2: '#1e293b',
                    amber: '#f59e0b',
                    amberGlow: '#fbbf24',
                    cyan: '#06b6d4',
                    cyanGlow: '#22d3ee',
                    red: '#ef4444',
                    emerald: '#10b981',
                    text: '#f8fafc',
                    dim: '#94a3b8',
                },
            },
            boxShadow: {
                'glow-cyan': '0 0 30px rgba(34, 211, 238, 0.25)',
                'glow-amber': '0 0 30px rgba(245, 158, 11, 0.35)',
                'glow-red': '0 0 30px rgba(239, 68, 68, 0.25)',
                'glow-emerald': '0 0 30px rgba(16, 185, 129, 0.25)',
            },
            keyframes: {
                'fade-in': {
                    from: { opacity: '0', transform: 'translateY(4px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                'fade-in': 'fade-in 0.25s ease-out both',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};


