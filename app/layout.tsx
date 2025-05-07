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
	metadataBase: new URL(process.env.NEXT_PUBLIC_URL || "https://www.oceandnaexplorer.org/")
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="scroll-smooth" suppressHydrationWarning>
			<body className={`${sourceSans.className} bg-base-100 text-base-content`}>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<ClerkAppearanceProvider>
						{children}
					</ClerkAppearanceProvider>
				</ThemeProvider>
				<ScrollToTop />
			</body>
		</html>
	);
}
