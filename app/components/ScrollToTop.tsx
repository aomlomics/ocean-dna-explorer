"use client";

import { useEffect, useState } from "react";

export default function ScrollToTop() {
	const [isVisible, setIsVisible] = useState(false);
	const [isNearFooter, setIsNearFooter] = useState(false);

	useEffect(() => {
		const toggleVisibility = () => {
			if (window.scrollY > 300) {
				setIsVisible(true);
			} else {
				setIsVisible(false);
			}

			// Check if we're near the bottom
			const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 150;
			setIsNearFooter(nearBottom);
		};

		window.addEventListener("scroll", toggleVisibility);
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
					className={`fixed right-8 p-4 bg-base-200 text-white rounded-full shadow-lg hover:bg-primary transition-all duration-300 z-50 ${
						isNearFooter ? "bottom-24" : "bottom-8"
					}`}
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
