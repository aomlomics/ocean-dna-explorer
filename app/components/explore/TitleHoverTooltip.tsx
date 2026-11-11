import type { ModelName } from "@/types/tableMetadata";
import TableMetadata from "@/types/tableMetadata";
import type { ReactNode } from "react";

export default function TitleHoverTooltip({
	table,
	children
}: {
	table: Uncapitalize<ModelName>;
	children: ReactNode;
}) {
	return (
		<div
			className="tooltip tooltip-bottom tooltip-start inline-flex before:text-base-content before:bg-base-200 before:border before:border-base-content/20"
			data-tip={TableMetadata[table].description}
		>
			{children}
		</div>
	);
}
