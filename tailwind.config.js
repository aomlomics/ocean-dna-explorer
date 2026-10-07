/** @type {import('tailwindcss').Config} */

import daisyui from "daisyui";
import scrollbar from "tailwind-scrollbar";

const config = {
	darkMode: "class",
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}"
	],
	theme: {
		extend: {
			// Typography system
			fontSize: {
				display: [
					"4.5rem",
					{
						lineHeight: "1.1",
						letterSpacing: "-0.02em",
						fontWeight: "700"
					}
				],
				h1: [
					"3rem",
					{
						lineHeight: "1.15",
						letterSpacing: "-0.01em",
						fontWeight: "700"
					}
				],
				h2: [
					"2rem",
					{
						lineHeight: "1.2",
						fontWeight: "500"
					}
				],
				h3: [
					"1.5rem",
					{
						lineHeight: "1.3",
						fontWeight: "500"
					}
				],
				"body-lg": [
					"1.125rem",
					{
						lineHeight: "1.4",
						fontWeight: "400"
					}
				],
				body: [
					"1rem",
					{
						lineHeight: "1.5",
						fontWeight: "400"
					}
				],
				ui: [
					"0.875rem",
					{
						lineHeight: "1.3",
						fontWeight: "500"
					}
				]
			},
			dropShadow: {
				"logo-light": ["0 1px 2px rgba(0,0,0,0.3)", "0 2px 4px rgba(0,0,0,0.2)"],
				"logo-dark": ["0 1px 2px rgba(255,255,255,0.1)", "0 2px 4px rgba(255,255,255,0.05)"]
			},
			animation: {
				"slide-in": "slide-in 1s ease-out forwards",
				"subtle-pan": "subtle-pan 30s ease-in-out infinite",
				"gradient-shine": "gradient-shine 8s ease-in-out infinite",
				float: "float 6s ease-in-out infinite",
				flash: "flash 1s ease-in-out"
			},
			keyframes: {
				"slide-in": {
					"0%": {
						transform: "translateY(-20px)",
						opacity: "0"
					},
					"100%": {
						transform: "translateY(0)",
						opacity: "1"
					}
				},
				"subtle-pan": {
					"0%, 100%": {
						transform: "scale(1.1) translate(0, 0)",
						filter: "brightness(1)"
					},
					"50%": {
						transform: "scale(1.1) translate(-2%, -2%)",
						filter: "brightness(1.2)"
					}
				},
				"gradient-shine": {
					"0%, 100%": {
						opacity: 1
					},
					"50%": {
						opacity: 0.8
					}
				},
				flash: {
					"0%, 100%": {
						backgroundColor: "transparent"
					},
					"50%": {
						backgroundColor: "rgb(var(--fallback-bc,oklch(var(--bc)/0.2)))"
					}
				}
			}
		}
	},
	plugins: [daisyui, scrollbar],
	daisyui: {
		themes: [
			{
				light: {
					primary: "#233D7F",
					secondary: "#233D7F",
					accent: "#7DBAE5",
					"accent-focus": "#4B95C3",
					"accent-content": "#E2E8F1",
					neutral: "#3d4451",
					"base-100": "#D1D5DB",
					"base-200": "#EAEAEE",
					"base-300": "#E3E3E9",
					"base-400": "#C6C6D2",
					"base-content": "#2D3748",
					"secondary-content": "#4A5568",
					"neutral-content": "#FFFFFF",
					"warning-content": "#1E2337",
					info: "#EAF2FF",
					"info-content": "#D3E4FF",
					"map-colors": "#FF6B6B"
				},
				dark: {
					primary: "#64ABDC",
					secondary: "#233D7F",
					accent: "#7DBAE5",
					"accent-focus": "#4B95C3",
					"accent-content": "#E2E8F1",
					neutral: "#3d4451",
					"base-100": "#141824",
					"base-200": "#1E2337",
					"base-300": "#232942",
					"base-400": "#385396",
					"base-content": "#E2E8F0",
					"secondary-content": "#A0AEC0",
					"neutral-content": "#1A1A1A",
					"warning-content": "#1E2337",
					info: "#2A3B6A",
					"info-content": "#314780",
					"map-colors": "#FF6B6B"
				}
			}
		],
		darkTheme: "dark",
		base: true,
		styled: true,
		utils: true,
		logs: false,
		themeRoot: ":root"
	}
};

export default config;
