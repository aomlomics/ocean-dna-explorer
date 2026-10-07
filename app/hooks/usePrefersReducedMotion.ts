"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onStoreChange: () => void) {
	const media = window.matchMedia(QUERY);
	media.addEventListener("change", onStoreChange);
	return () => media.removeEventListener("change", onStoreChange);
}

function getSnapshot() {
	return window.matchMedia(QUERY).matches;
}

/**
 * OS reduced-motion preference.
 * The server snapshot is false so the first render matches the hydrated HTML.
 * `useMediaQuery` is not used here because it calls setState inside an effect.
 */
export function usePrefersReducedMotion() {
	return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
