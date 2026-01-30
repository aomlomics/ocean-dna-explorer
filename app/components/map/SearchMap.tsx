"use client";

import { NetworkPacket, NullLocation } from "@/types/globals";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import DynamicMap from "./DynamicMap";
import { TableNames } from "@/types/tableMetadata";
import { Prisma } from "@/app/generated/prisma/client";

//TODO: if not sample page, still use shapes query, but internally query on samples, get list of samp_names, then use those to query on actual table
export default function SearchMap() {
	const searchParams = useSearchParams();

	const checkRef = useRef<HTMLInputElement>(null);

	const [loading, setLoading] = useState(true);
	const [locations, setLocations] = useState([] as NullLocation[]);

	useEffect(() => {
		async function doFetch(foundTable: Uncapitalize<Prisma.ModelName>, params: URLSearchParams) {
			const res = await fetch(`api/${foundTable}?getSamples=true${params.toString() ? "&" + params : ""}`);
			if (res.ok) {
				const json = (await res.json()) as NetworkPacket;
				if (json.statusMessage === "success") {
					if (checkRef.current && (params.getAll("polygon").length || params.getAll("circle").length)) {
						checkRef.current.checked = true;
					}

					setLocations(json.samples);
					setLoading(false);
					return;
				}
			}

			setLocations([]);
		}

		const paramsTable = searchParams.get("table");
		const foundTable = TableNames.find((t) => t.toLowerCase() === paramsTable?.toLowerCase());

		if (foundTable) {
			setLoading(true);
			const newParams = new URLSearchParams(searchParams);
			newParams.delete("table");

			doFetch(foundTable, newParams);
		}
	}, [searchParams]);

	return (
		<div className="collapse collapse-arrow bg-base-100 border-base-300 border">
			<input ref={checkRef} type="checkbox" />
			<div className="collapse-title font-semibold">Show on Map</div>
			<div className="collapse-content text-sm px-50">
				<div className="overflow-hidden bg-base-200 aspect-video rounded-lg">
					{loading ? (
						<div className="overflow-hidden bg-base-200 aspect-video rounded-lg">
							<div className="w-full h-full flex justify-center items-center">
								<div className="h-full aspect-square p-50">
									<span className="loading loading-spinner loading-xl h-full w-full" />
								</div>
							</div>
						</div>
					) : (
						<DynamicMap locations={locations} legend draw shapesToUrl cluster disableSearch />
					)}
				</div>
			</div>
		</div>
	);
}
