"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { DeadValueEnum } from "@/types/enums";
import { LatLng, LatLngBoundsExpression } from "leaflet";
import dynamic from "next/dynamic";
const ActualMap = dynamic(() => import("@/app/components/map/ActualMap"), {
	ssr: false
});

type Bounds = [[number, number], [number, number]];

const DEFAULT_BOUNDS = [
	[-180, -180],
	[180, 180]
] as Bounds;

type NullLocation = {
	decimalLatitude: number | null;
	decimalLongitude: number | null;
	[key: string]: any;
};

type Location = {
	decimalLatitude: number;
	decimalLongitude: number;
	[key: string]: any;
};

function findBoundsFromPoint(point: [number, number], bounds = DEFAULT_BOUNDS): Bounds {
	return [
		[Math.max(point[0], bounds[0][0]), Math.max(point[1], bounds[0][1])],
		[Math.min(point[0], bounds[1][0]), Math.min(point[1], bounds[1][1])]
	];
}

function findBoundsFromBounds(bounds1: Bounds, bounds2 = DEFAULT_BOUNDS): Bounds {
	return [
		[Math.max(bounds1[0][0], bounds2[0][0]), Math.max(bounds1[0][1], bounds2[0][1])],
		[Math.min(bounds1[1][0], bounds2[1][0]), Math.min(bounds1[1][1], bounds2[1][1])]
	];
}

function filterLocations(locsArray: NullLocation[]) {
	let filtered = [] as Location[];
	//calculate starting map view
	let props;

	if (locsArray.length === 1) {
		if (
			locsArray[0].decimalLatitude !== null &&
			locsArray[0].decimalLongitude !== null &&
			!(locsArray[0].decimalLatitude! in DeadValueEnum) &&
			!(locsArray[0].decimalLongitude! in DeadValueEnum)
		) {
			props = {
				center: [locsArray[0].decimalLatitude, locsArray[0].decimalLongitude] as [number, number],
				zoom: 5
			};

			filtered.push(locsArray[0] as Location);
		} else {
			props = { bounds: DEFAULT_BOUNDS };
		}
	} else {
		let bounds = DEFAULT_BOUNDS;

		for (const nullLoc of locsArray) {
			if (
				nullLoc.decimalLatitude !== null &&
				nullLoc.decimalLongitude !== null &&
				!(nullLoc.decimalLatitude! in DeadValueEnum) &&
				!(nullLoc.decimalLongitude! in DeadValueEnum)
			) {
				const loc = nullLoc as Location;

				bounds = findBoundsFromPoint([loc.decimalLatitude, loc.decimalLongitude], bounds);

				filtered.push(loc);
			}
		}

		props = { bounds };
	}

	return { props, filtered };
}

export default function Map({
	locations,
	id = "samp_name",
	titleTable,
	table = "sample",
	legend,
	cluster = false,
	draw = false
}: {
	locations: NullLocation[] | Record<string, { color: string; locs: NullLocation[] }>;
	id?: string;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	table?: Uncapitalize<Prisma.ModelName>;
	legend?: Record<string, string>;
	cluster?: boolean;
	draw?: boolean;
}) {
	//clump locations if they have identical latlng
	let newLocations;
	//calculate starting map view
	let mapProps;

	if (Array.isArray(locations)) {
		const { filtered, props } = filterLocations(locations);
		newLocations = filtered;
		mapProps = props;
	} else {
		newLocations = {} as Record<string, { color: string; locs: Location[] }>;
		let bounds = undefined as Bounds | undefined;
		for (const [key, ldata] of Object.entries(locations)) {
			const { filtered, props } = filterLocations(ldata.locs);

			newLocations[key] = { color: ldata.color, locs: filtered };

			if (props.center) {
				if (mapProps) {
					if (mapProps.center) {
						bounds = findBoundsFromPoint(props.center, findBoundsFromPoint(mapProps.center));
					} else {
						bounds = findBoundsFromPoint(props.center, bounds);
					}
				} else {
					mapProps = props;
				}
			} else {
				bounds = findBoundsFromBounds(props.bounds, bounds);
			}
		}

		if (bounds) {
			mapProps = { bounds };
		}
	}

	return (
		<ActualMap
			locations={newLocations}
			mapProps={
				mapProps as
					| {
							center: LatLng;
							zoom: number;
					  }
					| {
							bounds: LatLngBoundsExpression;
					  }
			}
			id={id}
			titleTable={titleTable}
			table={table}
			legend={legend}
			cluster={cluster}
			draw={draw}
		/>
	);
}
