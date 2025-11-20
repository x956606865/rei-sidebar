/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                arc: {
                    bg: 'var(--arc-bg)',
                    hover: 'var(--arc-hover)',
                    active: 'var(--arc-active)',
                    text: 'var(--arc-text)',
                    muted: 'var(--arc-muted)',
                }
            }
        },
    },
    plugins: [],
}
