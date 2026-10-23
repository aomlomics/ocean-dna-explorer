"use client";

import type { MapLocation, NullLocation } from "@/types/globals";
import { getWhereAdvancedHref, type LegendInfo } from "../utils/mapUtils";
import { type RefObject, useState } from "react";
import type { Map } from "leaflet";
import LeafletControlContainer from "../containers/LeafletControlContainer";
import CollapsibleMapContainer from "../containers/CollapsibleMapContainer";
import TableMetadata, { type ModelName } from "@/types/tableMetadata";
import ResizableMapContainer from "../containers/ResizableMapContainer";
import LocationList from "../utils/LocationList";

/**
 * {@link app/components/map/ActualMap.default | ActualMap} control that displays a {@link LocationList} of points without
 * location data.
 *
 * This control is hidden on mobile
 */
export default function NoLocationPointsControl({
	noLocationPoints,
	table,
	where,
	legendInfo,
	userDefinedOptions,
	mapRef,
	hideSearch
}: {
	/** The list of points that do not have location data. */
	noLocationPoints: NullLocation[];
	/** Table that the map is showing points for. */
	table: Uncapitalize<ModelName>;
	/** Prisma-style filter for linking to the search page. */
	where?: Record<string, string>;
	/** The object that stores information about the legend. */
	legendInfo: LegendInfo;
	/** The list of userDefined field names in the current dataset. */
	userDefinedOptions: Set<string>;
	/** A useRef for the parent map component. */
	mapRef: RefObject<Map | null>;
	/** Show or hide the button that links to the Search page. */
	hideSearch?: true;
}) {
	const [shown, setShown] = useState(false);

	return (
		<LeafletControlContainer click scroll className="hidden lg:block">
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
						<LocationList
							table={table}
							legendInfo={legendInfo}
							userDefinedOptions={userDefinedOptions}
							hideSearch={hideSearch}
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
		</LeafletControlContainer>
	);
}
