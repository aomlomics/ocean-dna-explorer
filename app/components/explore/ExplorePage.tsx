import { ReactNode } from "react";
import { FilterConfig } from "./filters/filterHelpers";
import TableFilter from "./filters/TableFilter";
import { Prisma } from "@/app/generated/prisma/client";
import TaxaGrid from "../paginated/TaxaGrid";
import TableMetadata from "@/types/tableMetadata";
import SearchBar from "../search/SearchBar";
import ExploreDisplay from "./ExploreDisplay";

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
	children: ReactNode;
	toggle?: true;
} & (
	| { displayMode?: "table"; tableWhere?: Record<string, any> | undefined }
	| { displayMode?: "grid"; tableWhere?: undefined }
)) {
	const titleField = TableMetadata[table].titleField;
	return (
		<div className="grid grid-cols-1 gap-y-4 pt-4">
			<header>
				<h1 className="text-4xl font-normal text-base-content">
					<span className="">Explore</span>{" "}
					<span className="text-base-content text-2xl align-middle font-normal">&gt;</span>{" "}
					<span className="text-primary font-normal">{TableMetadata[table].plural}</span>
				</h1>
				<div className="flex items-center gap-2 text-sm mt-6">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="h-4 w-4 text-primary"
					>
						<path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
					</svg>
					<span className="font-medium">
						Unique Key:{" "}
						<span className="font-semibold text-primary">
							{typeof titleField === "string" ? titleField : titleField.join(" / ")}
						</span>
					</span>
				</div>
			</header>

			<div className="prose max-w-full text-base-content/80">{children}</div>

			<SearchBar table={table} />
			<TableFilter tableConfig={tableConfig} />
			<ExploreDisplay table={table} tableWhere={tableWhere} displayMode={displayMode} toggle={toggle} />
		</div>
	);
}
