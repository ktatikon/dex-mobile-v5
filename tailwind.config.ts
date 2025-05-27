
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		fontFamily: {
			sans: ['Inter', 'sans-serif'],
		},
		spacing: {
			'0': '0px',
			'0.5': '0.125rem', // 2px
			'1': '0.25rem',    // 4px
			'1.5': '0.375rem', // 6px
			'2': '0.5rem',     // 8px
			'2.5': '0.625rem', // 10px
			'3': '0.75rem',    // 12px
			'3.5': '0.875rem', // 14px
			'4': '1rem',       // 16px
			'5': '1.25rem',    // 20px
			'6': '1.5rem',     // 24px
			'7': '1.75rem',    // 28px
			'8': '2rem',       // 32px
			'9': '2.25rem',    // 36px
			'10': '2.5rem',    // 40px
			'11': '2.75rem',   // 44px
			'12': '3rem',      // 48px
			'14': '3.5rem',    // 56px
			'16': '4rem',      // 64px
			'20': '5rem',      // 80px
			'24': '6rem',      // 96px
			'28': '7rem',      // 112px
			'32': '8rem',      // 128px
			'36': '9rem',      // 144px
			'40': '10rem',     // 160px
			'44': '11rem',     // 176px
			'48': '12rem',     // 192px
			'52': '13rem',     // 208px
			'56': '14rem',     // 224px
			'60': '15rem',     // 240px
			'64': '16rem',     // 256px
			'72': '18rem',     // 288px
			'80': '20rem',     // 320px
			'96': '24rem',     // 384px
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',

                // DEX specific colors - New color scheme
                dex: {
                    primary: '#FF3B30',     // Primary Red
                    secondary: '#1C1C1E',   // Dark Gray
                    dark: '#000000',        // Black background
                    card: '#1C1C1E',        // Secondary Dark Gray
                    tertiary: '#2C2C2E',    // Medium Gray
                    positive: '#34C759',    // Green
                    negative: '#FF3B30',    // Red
                    text: {
                        primary: '#FFFFFF',  // White
                        secondary: '#8E8E93', // Light Gray
                    },
                },

				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 4px)',
				sm: 'calc(var(--radius) - 4px)',
				card: '0.75rem',  // 12px for cards
				button: '0.5rem'  // 8px for buttons
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
                'pulse-subtle': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
                'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
