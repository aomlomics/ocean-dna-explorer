"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import InfoButton from "./InfoButton";

const tabBase =
	"inline-flex min-h-9 items-center justify-center px-3 py-2 text-center text-sm font-medium transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 sm:min-h-10 sm:px-4 sm:py-2.5 sm:text-[0.9375rem]";

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
	const query = searchParams.toString();
	const current = TABS.find((tab) => tab.href === pathname) ?? TABS[0];

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

			<nav
				id="visualizations"
				className="mt-5 flex min-w-0 flex-wrap content-center items-center gap-2 sm:gap-2"
				aria-label="Visualization types"
			>
				{TABS.map((tab) => {
					const active = pathname === tab.href;
					return (
						<Link
							key={tab.href}
							href={query ? `${tab.href}?${query}` : tab.href}
							scroll={false}
							className={`${tabBase} ${
								active
									? "bg-primary text-primary-content shadow-md"
									: "bg-base-200/90 text-base-content hover:bg-base-300 active:brightness-95"
							}`}
							aria-current={active ? "page" : undefined}
						>
							{tab.label}
						</Link>
					);
				})}
			</nav>
		</>
	);
}
