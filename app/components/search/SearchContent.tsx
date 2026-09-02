"use client";

import type { AssayModel, BlastQueryModel, BlastQueryResultModel, SampleModel } from "@/app/generated/prisma/models";
import DynamicMap from "../map/DynamicMap";
import MapWrapper from "../map/MapWrapper";
import TableDisplay from "../paginated/table/TableDisplay";
import BlastSearch from "./BlastSearch";
import BlastSearchResult from "./BlastSearchResult";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import TableMetadata, { type ModelName } from "@/types/tableMetadata";
import { BlastSearchIcon } from "../icons";

export default function SearchContent({
	table,
	assayNames
}: {
	table: Uncapitalize<ModelName>;
	assayNames: AssayModel["assay_name"][];
}) {
	const searchParams = useSearchParams();

	const [extraResults, setExtraResults] = useState({
		blastResult: undefined as BlastQueryResultModel[] | undefined,
		existingBlastDate: undefined as BlastQueryModel["dateCalculated"] | undefined,
		samples: undefined as SampleModel[] | undefined
	});
	const [mapKey, setMapKey] = useState("0");

	return (
		<>
			<div className="collapse collapse-arrow relative z-base mt-4.5 rounded-xl border border-base-300 bg-base-200/30 shadow-sm mb-4">
				<input key={table + "blastInput"} defaultChecked={!!searchParams.get("blastQuery")} type="checkbox" />
				<div className="collapse-title relative py-2.5 px-4 text-base font-medium text-base-content">
					<div className="z-10 flex items-center gap-2">
						<BlastSearchIcon />
						<span>BLAST</span>
					</div>
				</div>
				<div
					key={table + "blast"}
					className="search-focus-border collapse-content grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10"
				>
					<BlastSearch assayNames={assayNames} />
					<BlastSearchResult
						blastResult={extraResults.blastResult}
						existingBlastDate={extraResults.existingBlastDate}
						className="max-h-[min(32rem,70vh)] min-w-0 lg:h-200 lg:max-h-none"
					/>
				</div>
			</div>

			<div className="collapse collapse-arrow relative z-base mt-4.5 rounded-xl border border-base-300 bg-base-200/30 shadow-sm">
				<input
					key={table + "mapInput"}
					defaultChecked={!!(searchParams.get("circle") || searchParams.get("polygon"))}
					type="checkbox"
				/>
				<div className="collapse-title relative py-2.5 px-4 text-base font-medium text-base-content">
					<div className="z-10 flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.9}
							stroke="currentColor"
							className="size-5 text-primary"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
							/>
						</svg>
						<span>Show on Map</span>
					</div>
				</div>
				<div className="collapse-content text-sm p-0">
					<div className="rounded-lg">
						<MapWrapper loading={!extraResults.samples}>
							<DynamicMap
								key={mapKey}
								locations={extraResults.samples || []}
								legend
								draw
								shapesToUrl
								cluster
								disableSearch
							/>
						</MapWrapper>
					</div>
				</div>
			</div>

			<div className="mt-6 min-w-0" id="search-results">
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
					<TableDisplay
						key={table}
						table={table}
						displayMode={table === "taxonomy" ? "grid" : "table"}
						ignoreParams={["table"]}
						extraParams={{ getSamples: "true" }}
						setExtraResults={(args) => {
							setExtraResults(args);
							setMapKey((curr) => curr + 1);
						}}
						toggle={table === "taxonomy" || table === "project" || undefined}
					/>
				</div>
			</div>
		</>
	);
}
