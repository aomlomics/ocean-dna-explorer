import TableMetadata from "@/types/tableMetadata";
import InfoButton from "./InfoButton";
import type { Prisma } from "../generated/prisma/client";

export default function TableInfo({ table }: { table: Uncapitalize<Prisma.ModelName> }) {
	const titleField = TableMetadata[table].titleField;

	return (
		<InfoButton dir="tooltip-right">
			<div className="space-y-2">
				<div className="flex items-start gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="mt-0.5 h-4 w-4 shrink-0 text-primary"
					>
						<path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
					</svg>
					<p>
						<span className="font-semibold text-primary">Unique Key:</span>{" "}
						<span className="font-medium text-base-content">
							{typeof titleField === "string" ? titleField : titleField.join(" / ")}
						</span>
					</p>
				</div>
				<p>{TableMetadata[table].description}</p>
			</div>
		</InfoButton>
	);
}
