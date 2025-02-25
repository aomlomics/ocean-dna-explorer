"use client";

import { useEffect } from "react";

export function ActiveSectionTracker() {
	useEffect(() => {
		// This function runs on scroll to update active section
		const handleScroll = () => {
			// Get all sections with IDs and all navigation links
			const sections = document.querySelectorAll("section[id]");
			const navLinks = document.querySelectorAll('a[href^="#"]');

			// Reset all links to inactive state
			navLinks.forEach((link) => {
				link.classList.remove("text-primary", "font-medium");
			});

			// Find which section is currently visible
			for (const section of sections) {
				const rect = section.getBoundingClientRect();
				// Check if section is in viewport (with some offset)
				if (rect.top <= 100 && rect.bottom >= 100) {
					const id = section.id;
					// Find and highlight the corresponding navigation link
					const correspondingLink = document.querySelector(`a[href="#${id}"]`);
					if (correspondingLink) {
						correspondingLink.classList.add("text-primary", "font-medium");
					}
					break; // Stop after finding first visible section
				}
			}
		};

		// Run once after component mounts (with small delay for DOM to be ready)
		setTimeout(handleScroll, 100);

		// Set up scroll event listener
		window.addEventListener("scroll", handleScroll);
		// Clean up event listener when component unmounts
		return () => window.removeEventListener("scroll", handleScroll);
	}, []); // Empty dependency array means this runs once on mount

	// Component doesn't render any visible UI
	return null;
}
