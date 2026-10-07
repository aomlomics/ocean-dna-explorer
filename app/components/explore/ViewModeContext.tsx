"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type ViewMode = "table" | "grid";

const ViewModeContext = createContext<{
	mode: ViewMode;
	setMode: (m: ViewMode) => void;
} | null>(null);

export function ViewModeProvider({ children, initialMode = "table" }: { children: ReactNode; initialMode?: ViewMode }) {
	const [mode, setMode] = useState<ViewMode>(initialMode);
	return <ViewModeContext.Provider value={{ mode, setMode }}>{children}</ViewModeContext.Provider>;
}

export function useViewMode() {
	return useContext(ViewModeContext);
}
