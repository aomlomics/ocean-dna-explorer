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
		<div className="flex flex-col">
			<div className="py-4">
				<VisualizeTabs />
				<div className="mt-6">
					<SearchUI noTable />
				</div>
			</div>
			<div id="search-results" className="flex flex-col gap-2">
				{children}
			</div>
		</div>
	);
}
