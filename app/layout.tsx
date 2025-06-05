import "@/styles/globals.css";
import { Source_Sans_3 } from "next/font/google";
import ScrollToTop from "@/app/components/ScrollToTop";
import ClerkAppearanceProvider from "@/app/components/ClerkAppearanceProvider";
import { ThemeProvider } from "next-themes";

const sourceSans = Source_Sans_3({
	weight: ["300", "400", "500", "600", "700", "800"],
	subsets: ["latin"],
	display: "swap"
});

export const metadata = {
	title: "Ocean DNA Explorer",
	description:
		"A data sharing platform, search engine, and visualization and analysis tool for ocean environmental DNA data.",
	metadataBase: new URL(`${process.env.NODE_ENV === "production" ? "https" : "http"}://${process.env.NEXT_PUBLIC_URL}`)
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="scroll-smooth" suppressHydrationWarning>
			<head>
				<script
					dangerouslySetInnerHTML={{
						__html: `
							(function() {
								function getInitialTheme() {
									// Check if theme is stored in localStorage
									const storedTheme = localStorage.getItem('theme');
									if (storedTheme) {
										return storedTheme;
									}
									
									// Check if user prefers dark mode
									if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
										return 'dark';
									}
									
									// Default to light theme
									return 'light';
								}

								// Set the theme class on the document element
								document.documentElement.setAttribute('data-theme', getInitialTheme());
							})();
						`
					}}
				/>
			</head>
			<body className={`${sourceSans.className} bg-base-100 text-base-content`}>
				<ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem>
					<ClerkAppearanceProvider>{children}</ClerkAppearanceProvider>
				</ThemeProvider>
				<ScrollToTop />
			</body>
		</html>
	);
}
