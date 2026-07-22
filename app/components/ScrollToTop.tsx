"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Bottom strip of the viewport where the fixed button sits (~btn + padding + margin). */
const BUTTON_ZONE_PX = 120;

/** Above Leaflet controls/popups (max ~1000) so the button stays clickable over the map. */
const BUTTON_Z_INDEX = 10050;

function getScrollTop(): number {
	if (typeof window === "undefined") return 0;
	const el = document.scrollingElement ?? document.documentElement;
	return window.scrollY ?? el.scrollTop ?? 0;
}

export default function ScrollToTop() {
	const [isVisible, setIsVisible] = useState(false);
	const [footerOffset, setFooterOffset] = useState(0);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		const updatePosition = () => {
			setIsVisible(getScrollTop() > 300);

			const footer = document.querySelector("footer");
			if (!footer) {
				setFooterOffset(0);
				return;
			}

			const r = footer.getBoundingClientRect();
			const ih = window.innerHeight;
			const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
			const gap = remPx * 1.5;

			if (r.bottom <= 0 || r.top >= ih) {
				setFooterOffset(0);
				return;
			}

			const stripTop = ih - BUTTON_ZONE_PX;
			if (r.bottom <= stripTop) {
				setFooterOffset(0);
				return;
			}

			const effectiveTop = Math.max(r.top, stripTop);
			setFooterOffset(ih - effectiveTop + gap);
		};

		window.addEventListener("scroll", updatePosition, { passive: true });
		window.addEventListener("resize", updatePosition);
		updatePosition();

		return () => {
			window.removeEventListener("scroll", updatePosition);
			window.removeEventListener("resize", updatePosition);
		};
	}, []);

	const scrollToTop = () => {
		window.dispatchEvent(new CustomEvent("opal:scroll-to-top"));
		const root = document.scrollingElement ?? document.documentElement;
		root.scrollTo({ top: 0, behavior: "smooth" });
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	if (!mounted) {
		return null;
	}

	const button = (
		<>
			{isVisible && (
				<button
					type="button"
					onClick={scrollToTop}
					style={{
						bottom: footerOffset > 0 ? `${footerOffset}px` : "2rem",
						zIndex: BUTTON_Z_INDEX
					}}
					className="fixed right-8 p-4 bg-base-300 text-base-content rounded-full shadow-xl hover:bg-primary hover:text-primary-content transition-all duration-300 pointer-events-auto"
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

	return createPortal(button, document.body);
}
