"use client";

import { useEffect, useState, useRef } from "react";

export default function ScrollToTop() {
	const [isVisible, setIsVisible] = useState(false);
	const [isNearFooter, setIsNearFooter] = useState(false);
	const footerRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		// Assign footer element to ref
		footerRef.current = document.querySelector("footer");

		const toggleVisibility = () => {
			if (window.scrollY > 300) {
				setIsVisible(true);
			} else {
				setIsVisible(false);
			}

			// Check if we're near the bottom
			const footerHeight = footerRef.current?.offsetHeight || 0;
			const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - footerHeight;
			setIsNearFooter(nearBottom);
		};

		window.addEventListener("scroll", toggleVisibility);
		toggleVisibility(); // Initial check in case page loads near bottom

		return () => window.removeEventListener("scroll", toggleVisibility);
	}, []);

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth"
		});
	};

	return (
		<>
			{isVisible && (
				<button
					onClick={scrollToTop}
					style={{
						bottom: isNearFooter ? `${(footerRef.current?.offsetHeight || 96) + (window.innerWidth < 768 ? 40 : 22)}px` : "2rem"
					}}
					className="fixed right-8 p-4 bg-base-300 text-base-content rounded-full shadow-xl hover:bg-primary hover:text-primary-content transition-all duration-300 z-3000"
					aria-label="Scroll to top"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
					</svg>
				</button>
			)}
		</>
	);
}
