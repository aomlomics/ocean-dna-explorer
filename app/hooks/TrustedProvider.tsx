"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getClientSideCookie } from "../helpers/utils";

const TrustedContext = createContext<{
	trusted: boolean;
	setTrusted: (value: boolean) => void;
} | null>(null);

export default function TrustedProvider({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const [trusted, setTrustedState] = useState(true);

	useEffect(() => {
		setTrustedState(getClientSideCookie("trusted")?.toLowerCase() !== "false");
	}, []);

	const setTrusted = useCallback((value: boolean) => {
		document.cookie = `trusted=${value}; path=/`;
		setTrustedState(value);
		router.refresh();
	}, []);

	const value = useMemo(
		() => ({
			trusted,
			setTrusted
		}),
		[trusted, setTrusted]
	);

	return <TrustedContext.Provider value={value}>{children}</TrustedContext.Provider>;
}

export function useTrusted() {
	const context = useContext(TrustedContext);

	if (!context) {
		throw new Error("useTrusted must be used inside TrustedProvider");
	}

	return context;
}
