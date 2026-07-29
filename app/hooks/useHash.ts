"use client";

import { useEffect, useState } from "react";

export default function useHash() {
	const [hash, setHash] = useState(window.location.hash.substring(1));

	useEffect(() => {
		const updateHash = () => setHash(window.location.hash.substring(1));

		window.addEventListener("hashchange", updateHash);
		return () => window.removeEventListener("hashchange", updateHash);
	}, []);

	return hash;
}
