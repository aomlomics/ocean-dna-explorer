"use client";

import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import DynamicMap from "@/app/components/map/DynamicMap";
import MapWrapper from "@/app/components/map/MapWrapper";
import TableDisplay from "@/app/components/paginated/TableDisplay";
import BlastSearch from "@/app/components/search/BlastSearch";
import BlastSearchResult from "@/app/components/search/BlastSearchResult";
import SearchUI from "@/app/components/search/SearchUI";
import { Prisma, Sample } from "@/app/generated/prisma/client";
import { getDataTableNameSafe } from "@/app/helpers/schema";
import { capitalizeTable, getRandomKey } from "@/app/helpers/utils";
import { BlastResult } from "@/types/globals";
import TableMetadata from "@/types/tableMetadata";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Search() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [table, setTable] = useState(undefined as Uncapitalize<Prisma.ModelName> | undefined);
	const [extraResults, setExtraResults] = useState({ blastResult: [] as BlastResult, samples: [] as Sample[] });
	const [mapKey, setMapKey] = useState("0");

	useEffect(() => {
		const t = getDataTableNameSafe(searchParams.get("table"));
		if (!t) {
			router.replace("/search?table=project");
		} else {
			setTable(t);
		}
	}, [searchParams]);

	if (!table) return <></>;

	return (
		<>
			<div className="py-4">
				{table && (
					<header className="flex items-start justify-between">
						<h1 className="text-4xl font-normal text-base-content">
							<span className="">Search</span>{" "}
							<span className="text-base-content text-2xl align-middle font-normal">&gt;</span>{" "}
							<span className="text-primary font-normal">{TableMetadata[table].plural}</span>
						</h1>
					</header>
				)}
				<div className="w-full space-y-4 text-base-content/80 py-4">
					<p>{TableMetadata[table].description}</p>
					<ExploreTabButtons activeTable={capitalizeTable(table)} />
				</div>

				<SearchUI />
			</div>

			<div className="collapse collapse-arrow bg-base-100 border-base-300 border mb-4">
				<input key={table + "blastInput"} defaultChecked={!!searchParams.get("blastQuery")} type="checkbox" />
				<div className="collapse-title font-semibold">BLAST</div>
				<div className="collapse-content grid grid-cols-2">
					<BlastSearch key={table + "blast"} />
					<BlastSearchResult blastResult={extraResults.blastResult} />
				</div>
			</div>

			<div className="collapse collapse-arrow bg-base-100 border-base-300 border">
				<input
					key={table + "mapInput"}
					defaultChecked={!!(searchParams.get("circle") || searchParams.get("polygon"))}
					type="checkbox"
				/>
				<div className="collapse-title font-semibold">Show on Map</div>
				<div className="collapse-content text-sm px-50">
					<div className="overflow-hidden bg-base-200 rounded-lg">
						<MapWrapper loading={!extraResults.samples.length}>
							<DynamicMap key={mapKey} locations={extraResults.samples} legend draw shapesToUrl cluster disableSearch />
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
						toggle={table === "taxonomy" || undefined}
					/>
				</div>
			</div>
		</>
	);
}
