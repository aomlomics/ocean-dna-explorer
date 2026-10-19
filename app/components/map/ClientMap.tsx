"use client";

import type { NetworkPacket, NullLocation } from "@/types/globals";
import { useEffect, useState } from "react";
import DynamicMap from "./DynamicMap";
import { type ModelName } from "@/types/tableMetadata";

/**
 * A client component version of {@link app/components/map/Map.default | Map} that will fetch locations from a URL in a
 * useEffect. Use this component inside other client components that do not yet have locations.
 *
 * **Components:**
 *
 * - {@link DynamicMap}
 */
export default function ClientMap({
	url,
	where,
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
	/** The URL to fetch location data from. */
	url: string;
	where?: Record<string, string>;
	table?: Uncapitalize<ModelName>;
	cluster?: boolean;
	clusterRadius?: number;
	legend?: boolean;
	draw?: boolean;
	legendOmit?: string[];
	shapesToUrl?: true;
	disableSearch?: true;
	className?: string;
} & (
	| { titleTable?: Uncapitalize<ModelName>; defaultLegendField?: undefined }
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
			className={`overflow-hidden [:where(&)]:bg-base-200 [:where(&)]:aspect-square [:where(&)]:lg:aspect-video [:where(&)]:rounded-lg ${className ?? ""}`}
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
