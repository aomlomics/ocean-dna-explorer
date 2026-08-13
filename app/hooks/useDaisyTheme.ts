"use client";

import { useEffect, useState } from "react";

function getColor() {
	const computedElement = getComputedStyle(document.documentElement);
	const computedBody = getComputedStyle(document.body);

	return {
		textColor: computedElement.getPropertyValue("color") || computedBody.color,
		backgroundColor: computedElement.getPropertyValue("backgroundColor") || computedBody.backgroundColor,
		primaryColor: computedElement.getPropertyValue("--color-primary")
	};
}

export default function useDaisyTheme() {
	const [colors, setColors] = useState(getColor());

	useEffect(() => {
		// Listen for theme changes
		const observer = new MutationObserver(() => setColors(getColor()));
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-theme"]
		});

		return () => observer.disconnect();
	}, []);

	return colors;
}
