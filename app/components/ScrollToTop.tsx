"use client";

import { useEffect, useState, useRef } from "react";

export default function ScrollToTop() {
	const [isVisible, setIsVisible] = useState(false);
	const [footerOffset, setFooterOffset] = useState(0);
	const footerRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		footerRef.current = document.querySelector("footer");

		const updatePosition = () => {
			setIsVisible(window.scrollY > 300);

			if (!footerRef.current) return;

			// getBoundingClientRect gives the footer's position relative to the viewport.
			// If footerRect.top < viewportHeight, the footer has scrolled into view and we
			// need to lift the button by however many pixels of footer are visible.
			const footerRect = footerRef.current.getBoundingClientRect();
			const footerVisiblePx = Math.max(0, window.innerHeight - footerRect.top);

			// 1.5rem gap above the footer — use the computed root font-size so this
			// scales correctly with the fluid font-size: 0.8333vw rule.
			const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
			setFooterOffset(footerVisiblePx > 0 ? footerVisiblePx + remPx * 1.5 : 0);
		};

		window.addEventListener("scroll", updatePosition);
		updatePosition(); // Initial check in case page loads near bottom

		return () => window.removeEventListener("scroll", updatePosition);
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
						bottom: footerOffset > 0 ? `${footerOffset}px` : "2rem"
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
