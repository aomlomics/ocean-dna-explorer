"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { DeadValueEnum } from "@/types/enums";
import { MapProps, Location } from "@/types/globals";
import TableMetadata from "@/types/tableMetadata";
import dynamic from "next/dynamic";
const ActualMap = dynamic(() => import("@/app/components/map/ActualMap"), {
	ssr: false
});

type Bounds = [[number, number], [number, number]];

type NullLocation = {
	decimalLatitude: number | null;
	decimalLongitude: number | null;
	[key: string]: any;
};

const DEFAULT_BOUNDS = [
	[-180, -180],
	[180, 180]
] as Bounds;

export default function Map({
	locations,
	id = "samp_name",
	table = "sample",
	titleTable,
	cluster,
	clusterRadius,
	draw
}: {
	locations: NullLocation[];
	id?: string;
	table?: Uncapitalize<Prisma.ModelName>;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	cluster?: boolean;
	clusterRadius?: number;
	draw?: boolean;
}) {
	//clump locations if they have identical latlng
	let filteredLocations = [] as Location[];
	//calculate starting map view
	let mapProps;

	if (locations.length === 1) {
		if (
			locations[0].decimalLatitude !== null &&
			locations[0].decimalLongitude !== null &&
			!(locations[0].decimalLatitude! in DeadValueEnum) &&
			!(locations[0].decimalLongitude! in DeadValueEnum)
		) {
			mapProps = {
				center: [locations[0].decimalLatitude, locations[0].decimalLongitude] as [number, number],
				zoom: 5
			};

			filteredLocations.push(locations[0] as Location);
		} else {
			mapProps = { bounds: DEFAULT_BOUNDS };
		}
	} else {
		let bounds = DEFAULT_BOUNDS;

		for (const nullLoc of locations) {
			if (
				nullLoc.decimalLatitude !== null &&
				nullLoc.decimalLongitude !== null &&
				!(nullLoc.decimalLatitude! in DeadValueEnum) &&
				!(nullLoc.decimalLongitude! in DeadValueEnum)
			) {
				const loc = nullLoc as Location;

				//check if point already exists
				//don't combine points if they belong to different groups
				const titleFields = titleTable
					? typeof TableMetadata[titleTable].titleField === "string"
						? [TableMetadata[titleTable].titleField]
						: TableMetadata[titleTable].titleField
					: [];
				const foundIndex = filteredLocations.findIndex(
					(l) =>
						l.decimalLatitude === loc.decimalLatitude &&
						l.decimalLongitude === loc.decimalLongitude &&
						titleFields.every((f) => l[f] === loc[f])
				);

				if (foundIndex !== -1) {
					if (filteredLocations[foundIndex].values) {
						filteredLocations[foundIndex].values.push(loc);
					} else {
						filteredLocations[foundIndex].values = [filteredLocations[foundIndex], loc];
					}
				} else {
					bounds[0][0] = Math.max(loc.decimalLatitude, bounds[0][0]);
					bounds[0][1] = Math.max(loc.decimalLongitude, bounds[0][1]);
					bounds[1][0] = Math.min(loc.decimalLatitude, bounds[1][0]);
					bounds[1][1] = Math.min(loc.decimalLongitude, bounds[1][1]);

					filteredLocations.push({ ...loc });
				}
			}
		}

		mapProps = { bounds };
	}

	return (
		<ActualMap
			locations={filteredLocations}
			mapProps={mapProps as MapProps}
			id={id}
			table={table}
			titleTable={titleTable}
			cluster={cluster}
			clusterRadius={clusterRadius}
			draw={draw}
		/>
	);
}
