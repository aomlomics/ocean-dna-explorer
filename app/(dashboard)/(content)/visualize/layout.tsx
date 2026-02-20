import SearchUI from "@/app/components/search/SearchUI";
import VisualizeTabs from "@/app/components/VisualizeTabs";
import { ReactNode } from "react";

export default function VisualizeLayout({ children }: { children: ReactNode }) {
	return (
		<>
			<SearchUI noTable />
			<VisualizeTabs />
			{children}
		</>
	);
}
