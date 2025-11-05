"use client";

import { usePathname } from "next/navigation";
import { createContext, ReactNode, useContext, useState, useEffect, startTransition } from "react";
import LoadingSpinner from "@/app/components/LoadingSpinner";

interface NavigationContextType {}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
	const [isNavigating, setIsNavigating] = useState(false);
	const [showSpinner, setShowSpinner] = useState(false);
	const pathname = usePathname();

	useEffect(() => {
		// This effect handles hiding the spinner when navigation is complete.
		setIsNavigating(false);
	}, [pathname]);

	useEffect(() => {
		// This effect handles the delay before showing the spinner.
		let timer: NodeJS.Timeout;
		if (isNavigating) {
			timer = setTimeout(() => {
				setShowSpinner(true);
			}, 300);
		} else {
			setShowSpinner(false);
		}
		return () => clearTimeout(timer);
	}, [isNavigating]);

	useEffect(() => {
		// This is the "hacky" part. We listen for all clicks on the page.
		const handleMouseDown = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			// Find the closest link tag
			const link = target.closest("a");

			// Check if a link was clicked and if it's an internal link
			if (link && link.href && link.href.startsWith(window.location.origin)) {
				const linkPathname = new URL(link.href).pathname;
				// If the link is for a different page, start navigation.
				if (linkPathname !== pathname) {
					startTransition(() => {
						setIsNavigating(true);
					});
				}
			}
		};

		document.addEventListener("mousedown", handleMouseDown);
		return () => document.removeEventListener("mousedown", handleMouseDown);
	}, [pathname]); // Rerun this effect if the pathname changes

	return (
		<NavigationContext.Provider value={{}}>
			{showSpinner && <LoadingSpinner />}
			{children}
		</NavigationContext.Provider>
	);
};

export const useNavigation = () => {
	const context = useContext(NavigationContext);
	if (!context) {
		throw new Error("useNavigation must be used within a NavigationProvider");
	}
	return context;
};
