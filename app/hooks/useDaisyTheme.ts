import { useEffect, useState } from "react";

function getColor() {
	return getComputedStyle(document.documentElement).getPropertyValue("color") || getComputedStyle(document.body).color;
}

export default function useDaisyTheme() {
	const [textColor, setTextColor] = useState(getColor());

	useEffect(() => {
		// Listen for theme changes
		const observer = new MutationObserver(() => setTextColor(getColor()));
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-theme"]
		});

		return () => observer.disconnect();
	}, []);

	return { textColor };
}
