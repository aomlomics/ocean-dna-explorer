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
		// This effect is a fallback to hide the spinner when the path actually changes.
		setIsNavigating(false);
	}, [pathname]);

	useEffect(() => {
		let showTimer: NodeJS.Timeout | undefined;
		let failSafeTimer: NodeJS.Timeout | undefined;
		let observer: MutationObserver | undefined;

		const endNavigation = () => {
			setIsNavigating(false);
			if (observer) {
				observer.disconnect();
				observer = undefined;
			}
		};

		if (isNavigating) {
			// 1. Delay showing the spinner.
			showTimer = setTimeout(() => {
				setShowSpinner(true);
			}, 400); // Increased to 400ms as requested.

			// 2. The robust solution: Watch for DOM changes.
			const targetNode = document.getElementById("main-content");
			if (targetNode) {
				observer = new MutationObserver((mutationsList, obs) => {
					// Any change to the children of the main content area means navigation is complete.
					endNavigation();
				});
				observer.observe(targetNode, { childList: true, subtree: true });
			}

			// 3. A long safety-net timer just in case the observer fails.
			failSafeTimer = setTimeout(() => {
				console.warn("Navigation took too long, hiding spinner via failsafe.");
				endNavigation();
			}, 30000); // 30-second timeout.
		} else {
			setShowSpinner(false);
		}

		// Cleanup timers and the observer.
		return () => {
			clearTimeout(showTimer);
			clearTimeout(failSafeTimer);
			if (observer) {
				observer.disconnect();
			}
		};
	}, [isNavigating]);

	useEffect(() => {
		const handleMouseDown = (e: MouseEvent) => {
			if (isNavigating) return; // Prevent starting a new navigation while one is in progress

			const target = e.target as HTMLElement;
			const link = target.closest("a");

			if (link && link.href && link.href.startsWith(window.location.origin)) {
				const linkPathname = new URL(link.href).pathname;
				if (linkPathname !== pathname) {
					startTransition(() => {
						setIsNavigating(true);
					});
				}
			}
		};

		document.addEventListener("mousedown", handleMouseDown);
		return () => document.removeEventListener("mousedown", handleMouseDown);
	}, [pathname, isNavigating]); // Add isNavigating to dependencies

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
