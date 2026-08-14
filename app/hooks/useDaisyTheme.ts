"use client";

import { useEffect, useState } from "react";

function getColor() {
	const computedElement = getComputedStyle(document.documentElement);
	const computedBody = getComputedStyle(document.body);

	return {
		textColor: computedElement.getPropertyValue("color") || computedBody.color,
		backgroundColor: computedElement.getPropertyValue("backgroundColor") || computedBody.backgroundColor,
		primaryColor: computedElement.getPropertyValue("--color-primary"),
		theme: document.documentElement.getAttribute("data-theme") || "light"
	};
}

export default function useDaisyTheme() {
	//default light theme
	const [colors, setColors] = useState({
		textColor: "#334155",
		backgroundColor: "#f4f3f2",
		primaryColor: "#233d7f",
		theme: "light"
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
