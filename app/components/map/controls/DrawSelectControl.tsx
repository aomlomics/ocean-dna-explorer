"use client";

import { getWhereAdvancedHref, type LegendInfo } from "../utils/mapUtils";
import type { Map } from "leaflet";
import { type RefObject, useEffect, useState } from "react";
import type { MapShape, MapLocation } from "@/types/globals";
import LeafletControlContainer from "../containers/LeafletControlContainer";
import CollapsibleMapContainer from "../containers/CollapsibleMapContainer";
import TableMetadata, { type ModelName } from "@/types/tableMetadata";
import ResizableMapContainer from "../containers/ResizableMapContainer";
import { circleToString, polygonToString } from "@/app/helpers/utils";
import PopupWithSearchBody from "../popups/PopupWithSearchBody";

/**
 * {@link app/components/map/ActualMap.default | ActualMap} control that shows a list of locations selected by drawn
 * shapes.
 */
export default function DrawSelectedControl({
	pointsInside,
	table,
	where,
	legendInfo,
	userDefinedOptions,
	mapRef,
	shapes,
	hideSearch
}: {
	/** List of locations that are in the drawn shapes. */
	pointsInside: MapLocation[];
	/** Table that the map is showing points for. Used to link to the search page and passed to {@link PopupWithSearchBody}. */
	table: Uncapitalize<ModelName>;
	/** Prisma-style filter for linking to the search page. */
	where?: Record<string, string>;
	/** The object that stores information about the legend. Passed directly to {@link PopupWithSearchBody}. */
	legendInfo: LegendInfo;
	/** The list of userDefined field names in the current dataset. Passed directly to {@link PopupWithSearchBody}. */
	userDefinedOptions: Set<string>;
	/** A useRef for the parent map component. Passed directly to {@link ResizableMapContainer}. */
	mapRef: RefObject<Map | null>;
	/** A record that maps the drawn shapes to their internal ID managed by the the Leaflet draw library. */
	shapes: Record<string, MapShape>;
	/** Show or hide the button that links to the Search page. Passed directly to {@link PopupWithSearchBody}. */
	hideSearch?: true;
}) {
	const [shown, setShown] = useState(true);
	const [delayedPointsInside, setDelayedPointsInside] = useState(pointsInside);

	//delay changing state variable by 1 render cycle to allow for resizable to work
	// eslint-disable-next-line react-hooks/set-state-in-effect
	useEffect(() => setDelayedPointsInside(pointsInside), [pointsInside]);

	return (
		<LeafletControlContainer click scroll>
			<CollapsibleMapContainer
				dir="right"
				hiddenText={`Show ${TableMetadata[table].plural} selected with shapes`}
				onCollapse={(c) => setShown(!c)}
			>
				<ResizableMapContainer
					growDirection={"down"}
					detectChange={[shown]}
					mapRef={mapRef}
					maxMapHeight={0.6}
					maxMinHeight={175}
				>
					<div className="flex flex-col px-2">
						<div className="text-primary text-lg text-nowrap">Selected With Shapes</div>
						<PopupWithSearchBody
							table={table}
							legendInfo={legendInfo}
							userDefinedOptions={userDefinedOptions}
							hideSearch={hideSearch}
							loc={{
								decimalLatitude: NaN,
								decimalLongitude: NaN,
								values: delayedPointsInside
							}}
							href={`/search?table=${table}${
								where ? `&advanced=[${where ? getWhereAdvancedHref(where, table) : ""}]` : ""
							}&${Object.values(shapes)
								.map((s) => {
									if (s.type === "polygon") {
										return "polygon=" + polygonToString(s);
									} else if (s.type === "circle") {
										return "circle=" + circleToString(s);
									}
								})
								.join("&")}`}
						/>
					</div>
				</ResizableMapContainer>
			</CollapsibleMapContainer>
		</LeafletControlContainer>
	);
}
