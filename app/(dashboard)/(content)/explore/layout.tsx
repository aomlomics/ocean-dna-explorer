import type { ReactNode } from "react";

export const metadata = {
	title: "Explore",
	description: "Browse database tables with filtering and sorting. Open any record for full details."
};

export default function ExploreLayout({ children }: { children: ReactNode }) {
	return children;
}
