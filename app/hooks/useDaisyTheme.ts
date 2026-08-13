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
	//default light theme
	const [colors, setColors] = useState({
		textColor: "#334155",
		backgroundColor: "#f4f3f2",
		primaryColor: "#233d7f"
	});

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setColors(getColor());

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
