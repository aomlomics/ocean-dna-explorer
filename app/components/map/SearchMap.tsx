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

	const [locations, setLocations] = useState(undefined as NullLocation[] | undefined);
	const [table, setTable] = useState(undefined as Uncapitalize<Prisma.ModelName> | undefined);

	useEffect(() => {
		async function doFetch(foundTable: Uncapitalize<Prisma.ModelName>, params: URLSearchParams) {
			const res = await fetch(`api/${foundTable}${params.toString() ? "?" + params : ""}`);
			if (res.ok) {
				const json = (await res.json()) as NetworkPacket;
				if (json.statusMessage === "success") {
					setLocations(json.result);

					if (checkRef.current && (params.getAll("polygon").length || params.getAll("circle").length)) {
						checkRef.current.checked = true;
					}

					return;
				}
			}

			setLocations([]);
		}

		const paramsTable = searchParams.get("table");
		const foundTable = TableNames.find((t) => t.toLowerCase() === paramsTable?.toLowerCase());
		setTable(foundTable);

		if (foundTable && foundTable === "sample") {
			setLocations(undefined);
			const newParams = new URLSearchParams(searchParams);
			newParams.delete("table");

			doFetch(foundTable, newParams);
		}
	}, [searchParams]);

	if (table !== "sample") {
		return <></>;
	}

	let child;
	if (!locations) {
		child = (
			<div className="overflow-hidden bg-base-200 aspect-video rounded-lg">
				<div className="w-full h-full flex justify-center items-center">
					<div className="h-full aspect-square p-50">
						<span className="loading loading-spinner loading-xl h-full w-full" />
					</div>
				</div>
			</div>
		);
	} else {
		child = <DynamicMap locations={locations} legend draw shapesToUrl />;
	}

	return (
		<div className="collapse collapse-arrow bg-base-100 border-base-300 border">
			<input ref={checkRef} type="checkbox" />
			<div className="collapse-title font-semibold">Show on Map</div>
			<div className="collapse-content text-sm px-50">
				<div className="overflow-hidden bg-base-200 aspect-video rounded-lg">{child}</div>
			</div>
		</div>
	);
}
