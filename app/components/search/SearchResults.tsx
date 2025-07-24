"use client";

import { Prisma } from "@/app/generated/prisma/client";
import TableMetadata from "@/types/tableMetadata";
import { useSearchParams } from "next/navigation";
import TaxaGrid from "../paginated/TaxaGrid";
import Table from "../paginated/Table";

export default function SearchResults() {
	const searchParams = useSearchParams();

	const paramsTable = searchParams.get("table");
	if (paramsTable === null) {
		return <></>;
	}
	const table = paramsTable.toLowerCase() as Lowercase<Prisma.ModelName>;

	//TODO: scroll on first search
	return (
		<div className="bg-base-200 p-4 rounded-lg" id="searchResults">
			<h2 className="text-xl mb-4">
				Showing all{" "}
				{table && TableMetadata[table] ? (
					<span className="text-primary font-bold">{TableMetadata[table].plural}</span>
				) : (
					"results"
				)}{" "}
				that match your search
			</h2>

			{table ? (
				table === "taxonomy" ? (
					<TaxaGrid ignoreParams={["table"]} />
				) : (
					<div>
						<Table table={table} ignoreParams={["table"]} />
					</div>
				)
			) : (
				<>All Tables Results</>
			)}
		</div>
	);
}
