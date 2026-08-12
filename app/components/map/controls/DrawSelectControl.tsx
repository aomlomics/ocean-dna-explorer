"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { getWhereAdvancedHref, LegendInfo } from "../utils/mapUtils";
import { Map } from "leaflet";
import { RefObject, useEffect, useState } from "react";
import { MapShape } from "@/types/globals";
import LeafletControl from "./LeafletControl";
import CollapsibleMapContainer from "../containers/CollapsibleMapContainer";
import TableMetadata, { TableMetadataValue } from "@/types/tableMetadata";
import ResizableMapContainer from "../containers/ResizableMapContainer";
import { circleToString, polygonToString } from "@/app/helpers/utils";
import PopupWithSearchBody from "../popups/PopupWithSearchBody";
import { Location } from "@/types/globals";

export default function DrawSelectedControl({
	pointsInside,
	table,
	where,
	id,
	legendInfo,
	userDefinedOptions,
	mapRef,
	shapes,
	disableSearch
}: {
	pointsInside: Location[];
	table: Uncapitalize<Prisma.ModelName>;
	where?: Record<string, string>;
	id: TableMetadataValue["titleField"];
	legendInfo: LegendInfo;
	userDefinedOptions: Set<string>;
	mapRef: RefObject<Map | null>;
	shapes: Record<string, MapShape>;
	disableSearch?: true;
}) {
	const [shown, setShown] = useState(true);
	const [delayedPointsInside, setDelayedPointsInside] = useState(pointsInside);

	//delay changing state variable by 1 render cycle to allow for resizable to work
	// eslint-disable-next-line react-hooks/set-state-in-effect
	useEffect(() => setDelayedPointsInside(pointsInside), [pointsInside]);

	return (
		<LeafletControl click scroll>
			<CollapsibleMapContainer
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
							id={id}
							legendInfo={legendInfo}
							userDefinedOptions={userDefinedOptions}
							disableSearch={disableSearch}
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
		</LeafletControl>
	);
}
