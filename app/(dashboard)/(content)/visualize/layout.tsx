import SearchUI from "@/app/components/search/SearchUI";
import VisualizeTabs from "@/app/components/VisualizeTabs";
import { ReactNode } from "react";

export default function VisualizeLayout({ children }: { children: ReactNode }) {
	return (
		<div id="search-results" className="flex flex-col gap-2 pt-6">
			<SearchUI noTable />
			<VisualizeTabs />
			{children}
		</div>
	);
}
