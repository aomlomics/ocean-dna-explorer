"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import InfoButton from "./InfoButton";

const TABS = [
	{
		label: "Metadata",
		href: "/visualize/metadata",
		description:
			"Scatter plots of sample metadata. Choose axes such as collection date, depth, numeric fields, or other sample attributes to compare values across your filtered dataset."
	},
	{
		label: "Taxonomy",
		href: "/visualize/taxonomy",
		description:
			"Taxonomic distribution charts from your filtered occurrences. View abundance by taxonomic rank, per library or grouped by sample fields, using absolute or relative abundance."
	},
	{
		label: "Alpha Diversity",
		href: "/visualize/alphaDiversity",
		description:
			"Alpha diversity metrics computed on the server from your current filters. Compare diversity indexes across samples and libraries in your filtered dataset."
	}
] as const;

export default function VisualizeTabs() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const newParams = new URLSearchParams(searchParams);
	newParams.delete("chart");
	const stringParams = newParams.toString();

	const current = TABS.find((tab) => pathname.startsWith(tab.href))!;

	return (
		<>
			<header className="flex items-start justify-between">
				<div className="flex flex-wrap items-center gap-2">
					<h1 className="text-4xl font-normal text-base-content">
						<span>Visualize</span> <span className="text-base-content text-2xl align-middle font-normal">❯</span>{" "}
						<span className="text-primary font-normal">{current.label}</span>
					</h1>
					<InfoButton dir="tooltip-right">
						<p>{current.description}</p>
					</InfoButton>
				</div>
			</header>

			<nav id="visualizations" aria-label="Visualization types" className="flex gap-2 mt-2">
				<Link
					href={`/visualize/metadata${stringParams ? "?" + stringParams : ""}`}
					className={`btn ${pathname.startsWith("/visualize/metadata") ? "btn-primary text-primary-content" : "text-base-content"}`}
				>
					Sample Metadata
				</Link>
				<Link
					href={`/visualize/taxonomy?chart=abundance${stringParams ? "&" + stringParams : ""}`}
					className={`btn ${pathname.startsWith("/visualize/taxonomy") ? "btn-primary text-primary-content" : "text-base-content"}`}
				>
					Taxonomy
				</Link>
				<Link
					href={`/visualize/alphaDiversity${stringParams ? "?" + stringParams : ""}`}
					className={`btn ${pathname.startsWith("/visualize/alphaDiversity") ? "btn-primary text-primary-content" : "text-base-content"}`}
				>
					Alpha Diversity
				</Link>
			</nav>
		</>
	);
}
