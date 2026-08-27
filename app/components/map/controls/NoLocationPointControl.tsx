"use client";

import type { MapLocation, NullLocation } from "@/types/globals";
import { getWhereAdvancedHref, type LegendInfo } from "../utils/mapUtils";
import { type RefObject, useState } from "react";
import type { Map } from "leaflet";
import LeafletControl from "./LeafletControl";
import CollapsibleMapContainer from "../containers/CollapsibleMapContainer";
import TableMetadata, { type ModelName, type TableMetadataValue } from "@/types/tableMetadata";
import ResizableMapContainer from "../containers/ResizableMapContainer";
import PopupWithSearchBody from "../popups/PopupWithSearchBody";

export default function NoLocationPointsControl({
	noLocationPoints,
	table,
	where,
	id,
	legendInfo,
	userDefinedOptions,
	mapRef,
	disableSearch
}: {
	noLocationPoints: NullLocation[];
	table: Uncapitalize<ModelName>;
	where?: Record<string, string>;
	id: TableMetadataValue["titleField"];
	legendInfo: LegendInfo;
	userDefinedOptions: Set<string>;
	mapRef: RefObject<Map | null>;
	disableSearch?: true;
}) {
	const [shown, setShown] = useState(false);

	return (
		<LeafletControl click scroll>
			<CollapsibleMapContainer
				dir="left"
				defaultCollapse
				hiddenText={`Show ${TableMetadata[table].plural} with no location data`}
				onCollapse={(c) => setShown(!c)}
			>
				<ResizableMapContainer
					growDirection={"down"}
					detectChange={[shown]}
					mapRef={mapRef}
					maxMapHeight={0.55}
					maxMinHeight={200}
				>
					<div className="flex flex-col px-2">
						<div className="text-primary text-lg">No Location Data</div>
						<PopupWithSearchBody
							table={table}
							id={id}
							legendInfo={legendInfo}
							userDefinedOptions={userDefinedOptions}
							disableSearch={disableSearch}
							loc={{
								decimalLatitude: NaN,
								decimalLongitude: NaN,
								values: noLocationPoints as MapLocation[] //doesn't matter here
							}}
							href={`/search?table=${table}&advanced=[["OR",["decimalLatitude","null"],["decimalLatitude","deadValue","any"],["decimalLongitude","null"],["decimalLongitude","deadValue","any"]]${
								where ? "," + getWhereAdvancedHref(where, table) : ""
							}]`}
						/>
					</div>
				</ResizableMapContainer>
			</CollapsibleMapContainer>
		</LeafletControl>
	);
}
