/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                arc: {
                    bg: '#2B2D31', // Dark grey background similar to Arc
                    hover: '#3F4148', // Lighter grey for hover
                    active: '#4E5058', // Active tab background
                    text: '#FFFFFF',
                    muted: '#949BA4',
                }
            }
        },
    },
    plugins: [],
}
