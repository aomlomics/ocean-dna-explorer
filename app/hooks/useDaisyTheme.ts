import { useSyncExternalStore } from "react";

type DaisyColors = {
	textColor: string;
	backgroundColor: string;
	primaryColor: string;
};

const emptyColors: DaisyColors = {
	textColor: "",
	backgroundColor: "",
	primaryColor: ""
};

let cachedColors: DaisyColors = emptyColors;

function readColors(): DaisyColors {
	if (typeof document === "undefined") {
		return emptyColors;
	}

	const computedElement = getComputedStyle(document.documentElement);
	const computedBody = getComputedStyle(document.body);

	return {
		textColor: computedElement.getPropertyValue("color") || computedBody.color,
		backgroundColor: computedElement.getPropertyValue("backgroundColor") || computedBody.backgroundColor,
		primaryColor: computedElement.getPropertyValue("--color-primary")
	};
}

function getClientSnapshot(): DaisyColors {
	const next = readColors();
	if (
		next.textColor === cachedColors.textColor &&
		next.backgroundColor === cachedColors.backgroundColor &&
		next.primaryColor === cachedColors.primaryColor
	) {
		return cachedColors;
	}
	cachedColors = next;
	return cachedColors;
}

function subscribe(callback: () => void) {
	const observer = new MutationObserver(callback);
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["data-theme"]
	});
	return () => observer.disconnect();
}

export default function useDaisyTheme() {
	return useSyncExternalStore(subscribe, getClientSnapshot, () => emptyColors);
}
