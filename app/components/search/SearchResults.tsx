"use client";

import TableMetadata, { TableNames } from "@/types/tableMetadata";
import { useSearchParams } from "next/navigation";
import TaxaGrid from "../paginated/TaxaGrid";
import Table from "../paginated/Table";

export default function SearchResults() {
	const searchParams = useSearchParams();

	const paramsTable = searchParams.get("table");
	if (paramsTable === null) {
		return <></>;
	}
	const table = TableNames.find((model) => model.toLowerCase() === paramsTable.toLowerCase());
	if (!table) {
		return <>Invalid table</>;
	}

	return (
		<div>
			<h2 className="text-xl mb-2">
				Showing all{" "}
				{table && TableMetadata[table] ? (
					<span className="text-primary font-bold">{TableMetadata[table].plural}</span>
				) : (
					"results"
				)}{" "}
				that match your search
			</h2>

			<div className="w-full">
				{table ? (
					table === "taxonomy" ? (
						<TaxaGrid ignoreParams={["table"]} />
					) : (
						<Table
							key={table}
							table={table}
							ignoreParams={["table"]}
							defaultTake={25}
							omit={[
								"projectMetadataFileUrl_ODE",
								"sampleMetadataFileUrl_ODE",
								"libraryMetadataFileUrl_ODE",
								"analysisMetadataFileUrl_ODE",
								"asvFileUrl_ODE",
								"occurrenceFileUrl_ODE"
							]}
							className="p-0"
						/>
					)
				) : (
					<>All Tables Results</>
				)}
			</div>
		</div>
	);
}
