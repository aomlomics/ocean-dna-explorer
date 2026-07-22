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
import InfoButton from "@/app/components/InfoButton";
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
	const titleField = TableMetadata[model].titleField;
	const uniqueKey = typeof titleField === "string" ? titleField : titleField.join(" / ");
	const infoText = `Unique Key: ${uniqueKey}\n${TableMetadata[model].description}`;
	const infoContent = (
		<div className="space-y-2">
			<div className="flex items-start gap-2">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-primary">
					<path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
				</svg>
				<p>
					<span className="font-semibold text-primary">Unique Key:</span>{" "}
					<span className="font-medium text-base-content">{uniqueKey}</span>
				</p>
			</div>
			<p>{TableMetadata[model].description}</p>
		</div>
	);

	return (
		<>
			<div className="py-4">
				{table && (
					<header className="flex items-start justify-between">
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="text-4xl font-normal text-base-content">
								<span className="">Search</span>{" "}
								<span className="text-base-content text-2xl align-middle font-normal">&gt;</span>{" "}
								<span className="text-primary font-normal">{TableMetadata[table].plural}</span>
							</h1>
							<InfoButton infoText={infoText} infoContent={infoContent} dir="tooltip-right" className="translate-y-0.5" />
						</div>
					</header>
				)}
				<div className="mt-5 w-full text-base-content/80">
					<ExploreTabButtons activeTable={capitalizeTable(table)} />
				<div className="w-full space-y-4 text-base-content/80 py-4">
					<p>{TableMetadata[table].description}</p>
					<ExploreTabButtons activeTable={capitalizeTable(table)} />
				</div>

				<div className="mt-6">
					<SearchUI />
				</div>
			</div>

			<div className="collapse collapse-arrow bg-base-100 border-base-300 border mb-4">
				<input key={table + "blastInput"} defaultChecked={!!searchParams.get("blastQuery")} type="checkbox" />
				<div className="collapse-title font-semibold">BLAST</div>
				<div className="collapse-content grid grid-cols-2">
					<BlastSearch key={table + "blast"} />
					<BlastSearchResult blastResult={extraResults.blastResult} />
				</div>
			</div>

			<div className="collapse collapse-arrow bg-base-100 border-base-300 border mb-4">
				<input key={table + "blastInput"} defaultChecked={!!searchParams.get("blastQuery")} type="checkbox" />
				<div className="collapse-title font-semibold">BLAST</div>
				<div className="collapse-content grid grid-cols-2">
					<BlastSearch key={table + "blast"} />
					<BlastSearchResult blastResult={extraResults.blastResult} />
				</div>
			</div>

			<div className="collapse collapse-arrow mt-4.5 rounded-xl border border-base-300 bg-base-200/30 shadow-sm overflow-hidden">
				<input
					key={table + "mapInput"}
					defaultChecked={!!(searchParams.get("circle") || searchParams.get("polygon"))}
					type="checkbox"
				/>
				<div className="collapse-title relative py-2.5 px-4 text-base font-medium text-base-content overflow-hidden">
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
				<div className="collapse-content text-sm px-4 bg-base-100">
					<div className="overflow-hidden bg-base-200 rounded-lg pb-3">
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
						toggle={table === "taxonomy" || table === "project" || undefined}
					/>
				</div>
			</div>
		</>
	);
}
