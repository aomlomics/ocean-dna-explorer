"use client";

import { useEffect, useState } from "react";

function getColor() {
	const computedElement = getComputedStyle(document.documentElement);
	const computedBody = getComputedStyle(document.body);

	return {
		theme: document.documentElement.getAttribute("data-theme") || "light",
		textColor: computedElement.getPropertyValue("color") || computedBody.color,
		backgroundColor: computedElement.getPropertyValue("backgroundColor") || computedBody.backgroundColor,
		primaryColor: computedElement.getPropertyValue("--color-primary"),
		secondaryColor: computedElement.getPropertyValue("--color-secondary"),
		accentColor: computedElement.getPropertyValue("--color-accent")
	};
}

export default function useDaisyTheme() {
	//default light theme
	const [colors, setColors] = useState(() => {
		if (typeof document === "undefined") {
			return {
				theme: "light",
				textColor: "#334155",
				backgroundColor: "#f4f3f2",
				primaryColor: "#233d7f",
				secondaryColor: "#233d7f",
				accentColor: "#7dbae5"
			};
		}

		return getColor();
	});

	useEffect(() => {
		const updateTheme = () => setColors(getColor());

		// Listen for theme changes
		const observer = new MutationObserver(updateTheme);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-theme"]
		});

		updateTheme();

		return () => observer.disconnect();
	}, []);

	return colors;
}
