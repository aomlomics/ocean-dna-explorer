import type { FilterConfig } from "./filters/filterHelpers";
import TableMetadata, { type ModelName } from "@/types/tableMetadata";
import ExploreControls from "./ExploreControls";
import TableInfo from "../TableInfo";

export default function ExplorePage({
	table,
	tableConfig,
	displayMode = "table",
	tableWhere,
	toggle
}: {
	table: Uncapitalize<ModelName>;
	tableConfig: FilterConfig[];
	toggle?: true;
} & (
	| { displayMode?: "table"; tableWhere?: Record<string, any> | undefined }
	| { displayMode?: "grid"; tableWhere?: undefined }
)) {
	return (
		<div className="grid grid-cols-1 gap-y-4 pt-4">
			<header>
				<div className="flex flex-wrap items-center gap-2">
					<h1 className="text-4xl font-normal text-base-content">
						<span className="">Explore</span>{" "}
						<span className="text-base-content text-2xl align-middle font-normal">❯</span>{" "}
						<span className="text-primary font-normal">{TableMetadata[table].plural}</span>
					</h1>
					<TableInfo table={table} />
				</div>
			</header>

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
