"use client";

import { useEffect, useState } from "react";

/** Bottom strip of the viewport where the fixed button sits (~btn + padding + margin). */
const BUTTON_ZONE_PX = 120;

export default function ScrollToTop() {
	const [isVisible, setIsVisible] = useState(false);
	const [footerOffset, setFooterOffset] = useState(0);

	useEffect(() => {
		const updatePosition = () => {
			setIsVisible(window.scrollY > 300);

			const footer = document.querySelector("footer");
			if (!footer) {
				setFooterOffset(0);
				return;
			}

			const r = footer.getBoundingClientRect();
			const ih = window.innerHeight;
			const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
			const gap = remPx * 1.5;

			// Footer does not intersect the viewport.
			if (r.bottom <= 0 || r.top >= ih) {
				setFooterOffset(0);
				return;
			}

			// Only lift when the footer reaches the bottom strip where the button lives.
			// Avoids huge `bottom` values when the footer is tall and its top is above the viewport.
			const stripTop = ih - BUTTON_ZONE_PX;
			if (r.bottom <= stripTop) {
				setFooterOffset(0);
				return;
			}

			const effectiveTop = Math.max(r.top, stripTop);
			setFooterOffset(ih - effectiveTop + gap);
		};

		window.addEventListener("scroll", updatePosition);
		window.addEventListener("resize", updatePosition);
		updatePosition();

		return () => {
			window.removeEventListener("scroll", updatePosition);
			window.removeEventListener("resize", updatePosition);
		};
	}, []);

	const scrollToTop = () => {
		window.dispatchEvent(new CustomEvent("opal:scroll-to-top"));
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
					className="fixed right-8 p-4 bg-base-300 text-base-content rounded-full shadow-xl hover:bg-primary hover:text-primary-content transition-all duration-300 z-20"
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
