"use client";

import type { Prisma } from "@/app/generated/prisma/client";
import type { NetworkPacket, NullLocation } from "@/types/globals";
import { useEffect, useState } from "react";
import DynamicMap from "./DynamicMap";
import { TableMetadataValue } from "@/types/tableMetadata";

export default function ClientMap({
	url,
	where,
	id,
	table,
	titleTable,
	defaultLegendField,
	cluster,
	clusterRadius,
	legend,
	draw,
	legendOmit,
	shapesToUrl,
	disableSearch,
	className = ""
}: {
	url: string;
	where?: Record<string, string>;
	id?: TableMetadataValue["titleField"];
	table?: Uncapitalize<Prisma.ModelName>;
	cluster?: boolean;
	clusterRadius?: number;
	legend?: boolean;
	draw?: boolean;
	legendOmit?: string[];
	shapesToUrl?: true;
	disableSearch?: true;
	className?: string;
} & (
	| { titleTable?: Uncapitalize<Prisma.ModelName>; defaultLegendField?: undefined }
	| { titleTable?: undefined; defaultLegendField?: string }
)) {
	const [locations, setLocations] = useState(undefined as NullLocation[] | undefined);
	const [error, setError] = useState("");

	useEffect(() => {
		async function doFetch() {
			const res = await fetch(url);
			if (res.ok) {
				const response = (await res.json()) as NetworkPacket;
				if (response.statusMessage === "success") {
					setLocations(response.result);
				} else {
					setError(response.error);
				}
			} else {
				setError(res.statusText);
			}
		}

		doFetch();
	}, []);

	return (
		<div
			className={`overflow-hidden [:where(&)]:bg-base-200 [:where(&)]:aspect-video [:where(&)]:rounded-lg ${className ?? ""}`}
		>
			{error ? (
				<div className="w-full h-full flex justify-center items-center">
					<div className="h-full aspect-square p-50">
						<div>{error}</div>
					</div>
				</div>
			) : !locations ? (
				<div className="w-full h-full flex justify-center items-center">
					<div className="h-full aspect-square p-50">
						<span className="loading loading-spinner loading-xl h-full w-full" />
					</div>
				</div>
			) : (
				<DynamicMap
					locations={locations}
					where={where}
					id={id}
					table={table}
					titleTable={titleTable}
					defaultLegendField={defaultLegendField}
					cluster={cluster}
					clusterRadius={clusterRadius}
					legend={legend}
					draw={draw}
					legendOmit={legendOmit}
					shapesToUrl={shapesToUrl}
					disableSearch={disableSearch}
				/>
			)}
		</div>
	);
}
