import type { ReactNode } from "react";

export default function TitleHoverTooltip({ tooltip, children }: { tooltip: string; children: ReactNode }) {
	return (
		<div
			className="tooltip tooltip-bottom tooltip-start inline-flex before:text-base-content before:bg-base-200 before:border before:border-base-content/20"
			data-tip={tooltip}
		>
			{children}
		</div>
	);
}
