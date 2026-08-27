import SearchUI from "@/app/components/search/SearchUI";
import VisualizeTabs from "@/app/components/VisualizeTabs";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
	title: {
		default: "Visualize",
		template: "%s | Visualize ODE"
	}
};

export default function VisualizeLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex flex-col gap-2 pt-6">
			<SearchUI noTable />
			<div id="search-results" className="flex flex-col gap-2">
				<VisualizeTabs />
				{children}
			</div>
		</div>
	);
}
