"use client";

import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import DynamicMap from "@/app/components/map/DynamicMap";
import MapWrapper from "@/app/components/map/MapWrapper";
import TableDisplay from "@/app/components/paginated/TableDisplay";
import BlastSearch from "@/app/components/search/BlastSearch";
import BlastSearchResult from "@/app/components/search/BlastSearchResult";
import SearchUI from "@/app/components/search/SearchUI";
import { BlastQuery, BlastQueryResult, Prisma, Sample } from "@/app/generated/prisma/client";
import { getDataTableNameSafe } from "@/app/helpers/schema";
import { capitalizeTable, getRandomKey } from "@/app/helpers/utils";
import TableMetadata from "@/types/tableMetadata";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import TableInfo from "@/app/components/TableInfo";

export default function Search() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [table, setTable] = useState(undefined as Uncapitalize<Prisma.ModelName> | undefined);
	const [extraResults, setExtraResults] = useState({
		blastResult: undefined as BlastQueryResult[] | undefined,
		existingBlastDate: undefined as BlastQuery["dateCalculated"] | undefined,
		samples: undefined as Sample[] | undefined
	});
	const [mapKey, setMapKey] = useState("0");

	useEffect(() => {
		const t = getDataTableNameSafe(searchParams.get("table"));
		if (!t) {
			router.replace("/search?table=project");
		} else {
			setTable(t);
		}
	}, [searchParams]);

	//TODO: add loading state
	if (!table) return <></>;

	return (
		<>
			<div className="py-4">
				{table && (
					<header className="flex items-start justify-between">
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="text-4xl font-normal text-base-content">
								<span className="">Search</span>{" "}
								<span className="text-base-content text-2xl align-middle font-normal">❯</span>{" "}
								<span className="text-primary font-normal">{TableMetadata[table].plural}</span>
							</h1>
							<TableInfo table={table} />
						</div>
					</header>
				)}
				<div className="mt-5 w-full text-base-content/80">
					<ExploreTabButtons activeTable={capitalizeTable(table)} />
				</div>

				<div className="mt-6">
					<SearchUI />
				</div>
			</div>

			<div className="collapse collapse-arrow mt-4.5 rounded-xl border border-base-300 bg-base-200/30 shadow-sm mb-4">
				<input key={table + "blastInput"} defaultChecked={!!searchParams.get("blastQuery")} type="checkbox" />
				<div className="collapse-title relative py-2.5 px-4 text-base font-medium text-base-content">BLAST</div>
				<div key={table + "blast"} className="collapse-content grid grid-cols-2 gap-10">
					<BlastSearch />
					<BlastSearchResult
						blastResult={extraResults.blastResult}
						existingBlastDate={extraResults.existingBlastDate}
						className="h-200"
					/>
				</div>
			</div>

			<div className="collapse collapse-arrow mt-4.5 rounded-xl border border-base-300 bg-base-200/30 shadow-sm">
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

			<div className="mt-6" id="search-results">
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
							setMapKey(getRandomKey());
						}}
						toggle={table === "taxonomy" || table === "project" || undefined}
					/>
				</div>
			</div>
		</>
	);
}
