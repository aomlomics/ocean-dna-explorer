"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function VisualizeTabs() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	return (
		<nav id="visualizations" className="flex pt-2">
			<Link
				href={`/visualize/metadata?${searchParams.toString()}`}
				className={`btn px-6 py-3 transition-colors rounded-none ${
					pathname === "/visualize/metadata" ? "rounded-t-lg btn-primary" : ""
				}`}
			>
				Metadata
			</Link>
			<Link
				href={`/visualize/taxonomy?${searchParams.toString()}`}
				className={`btn px-6 py-3 transition-colors rounded-none ${
					pathname === "/visualize/taxonomy" ? "rounded-t-lg btn-primary" : ""
				}`}
			>
				Taxonomy
			</Link>
		</nav>
	);
}
