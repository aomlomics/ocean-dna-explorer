"use client";

import { Prisma } from "@/app/generated/prisma/client";
import TableMetadata from "@/types/tableMetadata";
import { useSearchParams } from "next/navigation";
import TaxaGrid from "../paginated/TaxaGrid";
import Table from "../paginated/Table";
import { uncapitalizeTable } from "@/app/helpers/utils";

export default function SearchResults() {
	const searchParams = useSearchParams();

	const paramsTable = searchParams.get("table");
	if (paramsTable === null) {
		return <></>;
	}
	const model = Object.keys(Prisma.ModelName).find(
		(model) => model.toLowerCase() === paramsTable.toLowerCase()
	) as Prisma.ModelName;
	if (!model) {
		return <>Invalid table</>;
	}
	const table = uncapitalizeTable(model as Prisma.ModelName);

	return (
		<div className="bg-base-200 p-4 rounded-lg">
			<h2 className="text-xl mb-4">
				Showing all{" "}
				{table && TableMetadata[table] ? (
					<span className="text-primary font-bold">{TableMetadata[table].plural}</span>
				) : (
					"results"
				)}{" "}
				that match your search
			</h2>

			<div className="aspect-4/2">
				{table ? (
					table === "taxonomy" ? (
						<TaxaGrid ignoreParams={["table"]} />
					) : (
						<Table
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
						/>
					)
				) : (
					<>All Tables Results</>
				)}
			</div>
		</div>
	);
}
