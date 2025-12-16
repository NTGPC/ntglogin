/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: [
        './index.html',
        './packages/admin-web/src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                inter: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            colors: {
                current: 'currentColor',
                'white': '#FFFFFF',
                'black': '#1C2434',
                // --- THAY ĐỔI Ở ĐÂY ---
                'primary': '#9BDBC3', // Mã màu cũ là #3C50E0, giờ đổi thành màu Bạc Hà (155, 219, 195)
                // ----------------------
                'stroke': '#E2E8F0',
                'gray': '#EFF4FB',
                'gray-2': '#F7F9FC',
                'whiten': '#F1F5F9',
                'boxdark': '#24303F',
                'boxdark-2': '#1A222C',
                'strokedark': '#2E3A47',
                'form-input': '#1D2A39',
                'meta-4': '#313D4A',
                'bodydark': '#AEB7C0',
                'bodydark1': '#DEE4EE',
                'bodydark2': '#8A99AF',
                'success': '#219653',
                'danger': '#D34053',
                'warning': '#FFA70B',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                primaryOld: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))',
                },
            },
        },
    },
    plugins: [],
}
