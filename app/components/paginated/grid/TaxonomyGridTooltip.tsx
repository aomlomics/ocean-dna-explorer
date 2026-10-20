import type { ReactNode } from "react";

export const TAXONOMY_GRID_TOOLTIP_CLASS =
	"tooltip before:text-base-content before:bg-base-200 before:border before:border-base-content/20";

export default function TaxonomyGridTooltip({
	tip,
	children,
	dir = "tooltip-top",
	className = ""
}: {
	tip: string;
	children: ReactNode;
	dir?: "tooltip-top" | "tooltip-bottom" | "tooltip-left" | "tooltip-right";
	className?: string;
}) {
	return (
		<div
			className={`${TAXONOMY_GRID_TOOLTIP_CLASS} ${dir} before:max-w-[min(90vw,24rem)] before:whitespace-normal before:wrap-anywhere ${className}`.trim()}
			data-tip={tip}
		>
			{children}
		</div>
	);
}
