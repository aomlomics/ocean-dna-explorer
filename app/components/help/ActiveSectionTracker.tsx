"use client";

import { useEffect } from "react";

export function ActiveSectionTracker() {
	useEffect(() => {
		const scrollToHash = () => {
			if (typeof window === "undefined") return;

			const rawHash = window.location.hash;
			if (!rawHash) return;

			const id = decodeURIComponent(rawHash.slice(1));
			if (!id) return;

			const target = document.getElementById(id);
			if (!target) return;

			const prefersReducedMotion =
				window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

			target.scrollIntoView({
				behavior: prefersReducedMotion ? "auto" : "smooth",
				block: "start"
			});
		};

		const timeoutId = window.setTimeout(scrollToHash, 0);
		window.addEventListener("hashchange", scrollToHash);

		return () => {
			window.clearTimeout(timeoutId);
			window.removeEventListener("hashchange", scrollToHash);
		};
	}, []);

	useEffect(() => {
		// First, make sure the initial section is highlighted
		const firstLink = document.querySelector('a[data-section-index="0"]');
		if (firstLink) {
			firstLink.classList.add("text-primary");
		}

		// Options for the observer
		const options = {
			root: null, // use the viewport
			rootMargin: "-10% 0px -85% 0px", // consider elements in the top 15% of screen
			threshold: 0 // trigger as soon as any part is visible
		};

		// Function to handle intersections
		const handleIntersection = (entries: IntersectionObserverEntry[]) => {
			// Find the first section that's intersecting (in viewport)
			const visibleEntry = entries.find((entry) => entry.isIntersecting);

			if (visibleEntry) {
				// Get all links and remove highlighting
				const allLinks = document.querySelectorAll("a[data-section-index]");
				allLinks.forEach((link) => link.classList.remove("text-primary"));

				// Get the section index and highlight the corresponding link
				const section = visibleEntry.target;
				const sectionIndex = section.getAttribute("data-section-index");
				const activeLink = document.querySelector(`a[data-section-index="${sectionIndex}"]`);

				if (activeLink) {
					activeLink.classList.add("text-primary");
				}
			}
		};

		// Create the observer
		const observer = new IntersectionObserver(handleIntersection, options);

		// Observe all main sections
		const sections = document.querySelectorAll("section[data-section-index]");
		sections.forEach((section) => observer.observe(section));

		// Cleanup
		return () => {
			sections.forEach((section) => observer.unobserve(section));
			observer.disconnect();
		};
	}, []);

	return null;
}
