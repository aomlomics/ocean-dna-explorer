"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

//TODO: use CSS variables instead of state and remove all state variables. then, fix hydration errors that the change causes
//current solution causes SSR for the entire site to essentially be disabled
//https://clerk.com/docs/nextjs/guides/customizing-clerk/appearance-prop/variables
export default function ClerkAppearanceProvider({ children }: { children: ReactNode }) {
	const { theme, resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const isDark = theme === "dark" || (theme === "system" && resolvedTheme === "dark");

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	return (
		<ClerkProvider
			appearance={{
				variables: {
					colorPrimary: "#233D7F",
					colorBackground: isDark ? "#141824" : "#F4F3F2",
					colorForeground: isDark ? "#E2E8F0" : "#2D3748"
				},
				elements: {
					// Portal root for <UserButton /> menu; must stack above Clerk's fixed instance banner
					userButtonPopoverRootBox: {
						zIndex: 2147483647
					},
					userPreviewSecondaryIdentifier: {
						color: isDark ? "#7DBAE5" : "#233D7F" // Email and secondary text
					},
					cardActionLink: {
						color: isDark ? "#7DBAE5" : "#233D7F" // "Update profile" link
					},
					profileSectionPrimaryButton: {
						color: isDark ? "#7DBAE5" : "#233D7F" // Profile section primary button
					},
					navbarButtonText: {
						color: isDark ? "#7DBAE5" : "#233D7F" // Navbar button text
					},
					navbarButtonIcon: {
						color: isDark ? "#7DBAE5" : "#233D7F" // Navbar icon color
					},
					activeNavbarButtonIcon: {
						color: isDark ? "#7DBAE5" : "#233D7F" // Active navbar icon color
					},
					connectedAccountPrimaryButton: {
						color: isDark ? "#7DBAE5" : "#233D7F"
					},
					connectedAccountButton: {
						color: isDark ? "#7DBAE5" : "#233D7F"
					},
					card: "shadow-2xl p-10 rounded-2xl border-4",
					logoImage: {
						width: "1000px",
						height: "40px"
					}
				}
			}}
			localization={{
				signIn: {
					start: {
						title: "Sign in to the Ocean DNA Explorer",
						titleCombined: "Sign in to the Ocean DNA Explorer"
					}
				},
				dividerText: "or"
			}}
		>
			{children}
		</ClerkProvider>
	);
}
