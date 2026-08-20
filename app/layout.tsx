import "@/styles/globals.css";
import { Source_Sans_3 } from "next/font/google";
import ScrollToTop from "@/app/components/ScrollToTop";
import ClerkAppearanceProvider from "@/app/components/ClerkAppearanceProvider";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import { ReactNode } from "react";
import TourProvider from "./hooks/TourProvider";
import TrustedProvider from "./hooks/TrustedProvider";

const sourceSans = Source_Sans_3({
	weight: ["300", "400", "500", "600", "700", "800"],
	subsets: ["latin"],
	display: "swap"
});

export const metadata = {
	title: "Ocean DNA Explorer",
	description:
		"A data sharing platform, search engine, and visualization and analysis tool for ocean environmental DNA data.",
	metadataBase: new URL(process.env.NEXT_PUBLIC_URL || "https://oceandnaexplorer.org")
};

export default async function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
			<head>
				<script
					dangerouslySetInnerHTML={{
						__html: `
			(function() {
				function getInitialTheme() {
					const storedTheme = localStorage.getItem('theme');
					if (storedTheme) {
						return storedTheme;
					}
					
					if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
						return 'dark';
					}
					
					return 'light';
				}

				document.documentElement.setAttribute('data-theme', getInitialTheme());
			})();
						`
					}}
				/>
			</head>
			<body className={`${sourceSans.className} bg-base-100 text-base-content`}>
				<a
					href="#main-content"
					className="btn btn-secondary text-primary-content left-4 top-4 z-max sr-only focus:not-sr-only focus:fixed focus:p-1"
				>
					Skip to content
				</a>
				<ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
					<ClerkAppearanceProvider>
						<TourProvider>
							<TrustedProvider>{children}</TrustedProvider>
						</TourProvider>
					</ClerkAppearanceProvider>
				</ThemeProvider>
				<Analytics />
				<ScrollToTop />
			</body>
		</html>
	);
}
