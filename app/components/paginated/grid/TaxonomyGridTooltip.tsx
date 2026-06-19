import { ReactNode } from "react";
import { SHARED_TOOLTIP_THEME_CLASS } from "@/app/components/viewAsSearchTooltip";

export const TAXONOMY_GRID_TOOLTIP_CLASS = `tooltip tooltip-top relative z-[1200] before:z-[1201] after:z-[1201] [--tt-bg:var(--color-base-200)] before:!whitespace-normal before:[overflow-wrap:anywhere] before:break-words ${SHARED_TOOLTIP_THEME_CLASS}`;

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
		<div className={`${TAXONOMY_GRID_TOOLTIP_CLASS} ${dir} ${className}`.trim()} data-tip={tip}>
			{children}
		</div>
	);
}
