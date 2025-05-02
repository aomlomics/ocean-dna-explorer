import "@/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Source_Sans_3 } from "next/font/google";
import ScrollToTop from "@/app/components/ScrollToTop";

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
				<ClerkProvider
					appearance={{
						elements: {
							footer: "hidden",
							logoImage: {
								width: "1200px"
							}
						}
					}}
					localization={{
						signIn: {
							start: {
								title: "Sign in to Submit Data",
								// __experimental_titleCombined: "Sign in to Submit Data",
								// subtitle: "Sign in with a @noaa.gov Google account or @ngi.msstate.edu Microsoft account.",
								// @ts-ignore - subtitleCombined is needed for the UI but not in types
								// subtitleCombined: "Sign in with a @noaa.gov Google account or @ngi.msstate.edu Microsoft account.",
								titleCombined: "Sign in to Submit Data"
								// actionText: "You must use a NOAA or MSState email address to sign in."
							}
						},
						dividerText: "or"
						// formFieldLabel: {
						// 	emailAddress: "Email Address"
						// }
					}}
					signInFallbackRedirectUrl="/dashboard"
					// fallbackRedirectUrl="/dashboard"
					// after_sign_in_url="/dashboard"
				>
					{children}
				</ClerkProvider>
				<ScrollToTop />
			</body>
		</html>
	);
}
