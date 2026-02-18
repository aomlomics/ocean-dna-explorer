import { useEffect, useState } from "react";

export default function useDaisyTheme() {
	const [textColor, setTextColor] = useState("currentColor");

	useEffect(() => {
		// Get the actual computed color value
		function updateColor() {
			setTextColor(
				getComputedStyle(document.documentElement).getPropertyValue("color") || getComputedStyle(document.body).color
			);
		}

		updateColor();

		// Listen for theme changes
		const observer = new MutationObserver(updateColor);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-theme"]
		});

		return () => observer.disconnect();
	}, []);

	return { textColor };
}
