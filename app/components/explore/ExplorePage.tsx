import { ReactNode } from "react";
import { FilterConfig } from "./filters/filterHelpers";
import { Prisma } from "@/app/generated/prisma/client";
import TableMetadata from "@/types/tableMetadata";
import ExploreControls from "./ExploreControls";
import InfoButton from "../InfoButton";

export default function ExplorePage({
	table,
	tableConfig,
	children,
	displayMode = "table",
	tableWhere,
	toggle
}: {
	table: Uncapitalize<Prisma.ModelName>;
	tableConfig: FilterConfig[];
	children?: ReactNode;
	toggle?: true;
} & (
	| { displayMode?: "table"; tableWhere?: Record<string, any> | undefined }
	| { displayMode?: "grid"; tableWhere?: undefined }
)) {
	const titleField = TableMetadata[table].titleField;

	return (
		<div className="grid grid-cols-1 gap-y-4 pt-4">
			<header>
				<div className="flex flex-wrap items-center gap-2">
					<h1 className="text-4xl font-normal text-base-content">
						<span className="">Explore</span>{" "}
						<span className="text-base-content text-2xl align-middle font-normal">&gt;</span>{" "}
						<span className="text-primary font-normal">{TableMetadata[table].plural}</span>
					</h1>
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
				</div>
			</header>

			{children ? <div className="prose max-w-full text-base-content/80">{children}</div> : null}

			<ExploreControls
				table={table}
				tableConfig={tableConfig}
				toggle={toggle}
				displayMode={displayMode}
				tableWhere={tableWhere}
			/>
		</div>
	);
}
