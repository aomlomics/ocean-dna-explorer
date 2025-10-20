"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { DeadValueEnum } from "@/types/enums";
import { LatLng, LatLngBoundsExpression } from "leaflet";
import dynamic from "next/dynamic";
const ActualMap = dynamic(() => import("@/app/components/map/ActualMap"), {
	ssr: false
});

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
	let mapProps;
	if (
		locations.length === 1 &&
		locations[0].decimalLatitude !== null &&
		locations[0].decimalLongitude !== null &&
		!(locations[0].decimalLatitude! in DeadValueEnum) &&
		!(locations[0].decimalLongitude! in DeadValueEnum)
	) {
		mapProps = {
			center: [locations[0].decimalLatitude!, locations[0].decimalLongitude!] as unknown as LatLng,
			zoom: 5
		};
	} else {
		const bounds = [
			[-180, -180],
			[180, 180]
		];
		for (const loc of locations) {
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
			locations={locations}
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
