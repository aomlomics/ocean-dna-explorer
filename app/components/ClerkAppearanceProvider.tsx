"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

//TODO: use CSS variables instead of state and remove all state variables. then, fix hydration errors that the change causes
//current solution causes SSR for the entire site to essentially be disabled
//https://clerk.com/docs/nextjs/guides/customizing-clerk/appearance-prop/variables
export default function ClerkAppearanceProvider({ children }: { children: ReactNode }) {
	return (
		<ClerkProvider
			appearance={{
				variables: {
					colorPrimary: "var(--clerk-color-primary)",
					colorBackground: "var(--clerk-color-background)",
					colorForeground: "var(--clerk-color-foreground)"
				},
				elements: {
					// Portal root for <UserButton /> menu; must stack above Clerk's fixed instance banner
					userButtonPopoverRootBox: {
						zIndex: 2147483647
					},
					userPreviewSecondaryIdentifier: {
						color: "var(--clerk-color-text-secondary)" // Email and secondary text
					},
					cardActionLink: {
						color: "var(--clerk-color-text-secondary)" // "Update profile" link
					},
					profileSectionPrimaryButton: {
						color: "var(--clerk-color-text-secondary)" // Profile section primary button
					},
					navbarButtonText: {
						color: "var(--clerk-color-text-secondary)" // Navbar button text
					},
					navbarButtonIcon: {
						color: "var(--clerk-color-text-secondary)" // Navbar icon color
					},
					activeNavbarButtonIcon: {
						color: "var(--clerk-color-text-secondary)" // Active navbar icon color
					},
					connectedAccountPrimaryButton: {
						color: "var(--clerk-color-text-secondary)"
					},
					connectedAccountButton: {
						color: "var(--clerk-color-text-secondary)"
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
						title: "Sign in to ODE",
						titleCombined: "Sign in to ODE"
					}
				},
				dividerText: "or"
			}}
		>
			{children}
		</ClerkProvider>
	);
}
