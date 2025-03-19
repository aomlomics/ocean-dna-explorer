"use client";

import { useEffect } from "react";

export function ActiveSectionTracker() {
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
