import SearchUI from "@/app/components/search/SearchUI";
import { ReactNode } from "react";

export default function VisualizeLayout({ children }: { children: ReactNode }) {
	return (
		<>
			<SearchUI noTable />
			{children}
		</>
	);
}
