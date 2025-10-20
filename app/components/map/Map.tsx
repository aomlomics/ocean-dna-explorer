"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { DeadValueEnum } from "@/types/enums";
import TableMetadata from "@/types/tableMetadata";
import { LatLng, LatLngBoundsExpression } from "leaflet";
import dynamic from "next/dynamic";
const ActualMap = dynamic(() => import("@/app/components/map/ActualMap"), {
	ssr: false
});

type Location = {
	decimalLatitude: number;
	decimalLongitude: number;
	color?: string;
	values?: string[];
	[key: string]: any;
};

export default function Map({
	locations,
	id = "samp_name",
	titleTable,
	iconSize,
	table = "sample",
	legend,
	cluster = false,
	draw = false
}: {
	locations: {
		decimalLatitude: number | null;
		decimalLongitude: number | null;
		color?: string;
		values?: string[];
		[key: string]: any;
	}[];
	id?: string;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	iconSize?: number;
	table?: Uncapitalize<Prisma.ModelName>;
	legend?: Record<string, string>;
	cluster?: boolean;
	draw?: boolean;
}) {
	//clump locations if they have identical latlng
	const filteredLocations = [] as Location[];

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
					filteredLocations[foundIndex].values.push(loc[id]);
				} else {
					filteredLocations[foundIndex].values = [filteredLocations[foundIndex][id], loc[id]];
				}
			} else {
				filteredLocations.push({ ...loc });
			}
		}
	}

	//calculate starting map view
	let mapProps;
	if (filteredLocations.length === 1) {
		mapProps = {
			center: [filteredLocations[0].decimalLatitude, filteredLocations[0].decimalLongitude] as unknown as LatLng,
			zoom: 5
		};
	} else {
		const bounds = [
			[-180, -180],
			[180, 180]
		];
		for (const loc of filteredLocations) {
			if (
				loc.decimalLatitude !== null &&
				loc.decimalLongitude !== null &&
				!(loc.decimalLatitude! in DeadValueEnum) &&
				!(loc.decimalLongitude! in DeadValueEnum)
			) {
				//minLat
				if (loc.decimalLatitude > bounds[0][0]) {
					bounds[0][0] = loc.decimalLatitude;
				}

				//maxLat
				if (loc.decimalLatitude < bounds[1][0]) {
					bounds[1][0] = loc.decimalLatitude;
				}

				//minLng
				if (loc.decimalLongitude > bounds[0][1]) {
					bounds[0][1] = loc.decimalLongitude;
				}

				//maxLng
				if (loc.decimalLongitude < bounds[1][1]) {
					bounds[1][1] = loc.decimalLongitude;
				}
			}
		}
		mapProps = { bounds: bounds as LatLngBoundsExpression };
	}

	return (
		<ActualMap
			locations={filteredLocations}
			mapProps={mapProps}
			id={id}
			titleTable={titleTable}
			iconSize={iconSize}
			table={table}
			legend={legend}
			cluster={cluster}
			draw={draw}
		/>
	);
}
