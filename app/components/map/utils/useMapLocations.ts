import { DeadValueEnum } from "@/types/enums";
import type { MapLocation, MapLocationWithValues, NullLocation } from "@/types/globals";
import TableMetadata, { type ModelName } from "@/types/tableMetadata";
import type { LatLng, LatLngBoundsExpression } from "leaflet";
import { chromaMin, getLegendValue, getMapLegendField, type LegendInfo, legendValueSort, lightMin } from "./mapUtils";
import distinctColors from "distinct-colors";
import type { Color } from "chroma-js";

type MapProps =
	| {
			center: LatLng;
			zoom: number;
			bounds?: undefined;
	  }
	| {
			center?: undefined;
			zoom?: undefined;
			bounds: LatLngBoundsExpression;
	  };

type Bounds = [[number, number], [number, number]];

function ddmToDec(deg: string) {
	const trimmed = deg.trim();
	const dir = trimmed.slice(-1).toUpperCase();
	let dirFactor;
	if (dir === "N" || dir === "E") {
		dirFactor = 1;
	} else if (dir === "S" || dir === "W") {
		dirFactor = -1;
	} else {
		return;
	}

	const degArray = trimmed.slice(0, -1).trim().split(" ");
	if (!degArray[0] || !degArray[1]) {
		return;
	}

	const secondNum = parseFloat(degArray[1]);
	if (secondNum >= 60) {
		return;
	}

	return (parseInt(degArray[0]) + secondNum / 60) * dirFactor;
}

function verbatimToArray(verbatim: string | undefined | null) {
	if (!verbatim) {
		return;
	}

	const split = verbatim.split("|");
	if (split.length < 2) {
		return;
	}

	const first = ddmToDec(split.shift()!);
	if (first == null || isNaN(first)) {
		return;
	}

	const last = ddmToDec(split.pop()!);
	if (last == null || isNaN(last)) {
		return;
	}

	const arr = [first];
	for (const s of split) {
		const dec = ddmToDec(s);
		if (dec != null && !isNaN(dec)) {
			arr.push(dec);
		}
	}
	arr.push(last);

	return arr;
}

export default function useMapLocations({
	locations,
	omit,
	table,
	titleTable,
	defaultLegendField
}: {
	locations: NullLocation[];
	omit: string[];
	table: Uncapitalize<ModelName>;
	titleTable?: Uncapitalize<ModelName>;
	defaultLegendField?: string;
}) {
	//clump locations if they have identical latlng
	const filteredLocations = [] as Array<MapLocation | MapLocationWithValues>;
	//track points with invalid location data
	const noLocationPoints = [] as NullLocation[];
	//calculate starting map view
	let mapProps = {} as MapProps;
	//legend options
	const defaultOptions = new Set() as Set<string>;
	const userDefinedOptions = new Set() as Set<string>;

	const DEFAULT_BOUNDS = [
		[-90, -180],
		[90, 180]
	] as Bounds;

	if (locations.length === 1) {
		const firstLoc = locations[0]!;
		if (
			firstLoc.decimalLatitude !== null &&
			firstLoc.decimalLongitude !== null &&
			!(firstLoc.decimalLatitude! in DeadValueEnum) &&
			!(firstLoc.decimalLongitude! in DeadValueEnum)
		) {
			const verbatimLatitudeArray = verbatimToArray(firstLoc.verbatimLatitude);
			const verbatimLongitudeArray = verbatimToArray(firstLoc.verbatimLongitude);
			if (
				verbatimLatitudeArray &&
				verbatimLongitudeArray &&
				verbatimLatitudeArray.length === verbatimLongitudeArray.length &&
				//make sure the array goes somewhere
				(verbatimLatitudeArray.length !== 2 ||
					verbatimLatitudeArray[0] !== verbatimLatitudeArray[verbatimLatitudeArray.length - 1] ||
					verbatimLongitudeArray[0] !== verbatimLongitudeArray[verbatimLongitudeArray.length - 1])
			) {
				const bounds = DEFAULT_BOUNDS;
				const polylines = [] as [number, number][];
				for (let i = 0; i < verbatimLatitudeArray.length; i++) {
					const lat = verbatimLatitudeArray[i]!;
					const lng = verbatimLongitudeArray[i]!;

					bounds[0][0] = Math.max(lat, bounds[0][0]);
					bounds[0][1] = Math.max(lng, bounds[0][1]);
					bounds[1][0] = Math.min(lat, bounds[1][0]);
					bounds[1][1] = Math.min(lng, bounds[1][1]);

					polylines.push([lat, lng]);
				}
				mapProps = { bounds };

				filteredLocations.push({
					...(firstLoc as MapLocation),
					polylines
				});
			} else {
				mapProps = {
					center: [firstLoc.decimalLatitude, firstLoc.decimalLongitude] as unknown as LatLng,
					zoom: 5
				};

				filteredLocations.push(firstLoc as MapLocation);
			}
		} else {
			noLocationPoints.push(firstLoc);
			mapProps = { bounds: DEFAULT_BOUNDS };
		}

		if (firstLoc.userDefined) {
			for (const opt in firstLoc.userDefined) {
				userDefinedOptions.add(opt);
			}
		}
	} else {
		const bounds = DEFAULT_BOUNDS;

		for (const nullLoc of locations) {
			if (
				nullLoc.decimalLatitude !== null &&
				nullLoc.decimalLongitude !== null &&
				!(nullLoc.decimalLatitude! in DeadValueEnum) &&
				!(nullLoc.decimalLongitude! in DeadValueEnum)
			) {
				const loc = { ...nullLoc } as MapLocation;

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
					const found = filteredLocations[foundIndex]!;
					if (found.values) {
						found.values.push(loc);
					} else {
						found.values = [{ ...found } as MapLocation, loc];
					}
				} else {
					bounds[0][0] = Math.max(loc.decimalLatitude, bounds[0][0]);
					bounds[0][1] = Math.max(loc.decimalLongitude, bounds[0][1]);
					bounds[1][0] = Math.min(loc.decimalLatitude, bounds[1][0]);
					bounds[1][1] = Math.min(loc.decimalLongitude, bounds[1][1]);

					if (titleTable) {
						defaultOptions.add(getLegendValue(TableMetadata[titleTable].titleField, loc, userDefinedOptions));
					}

					const verbatimLatitudeArray = verbatimToArray(loc.verbatimLatitude);
					const verbatimLongitudeArray = verbatimToArray(loc.verbatimLongitude);
					let polylines = undefined as undefined | [number, number][];
					if (
						verbatimLatitudeArray &&
						verbatimLongitudeArray &&
						verbatimLatitudeArray.length === verbatimLongitudeArray.length &&
						//make sure the array goes somewhere
						(verbatimLatitudeArray.length !== 2 ||
							verbatimLatitudeArray[0] !== verbatimLatitudeArray[verbatimLatitudeArray.length - 1] ||
							verbatimLongitudeArray[0] !== verbatimLongitudeArray[verbatimLongitudeArray.length - 1])
					) {
						polylines = [];
						for (let i = 0; i < verbatimLatitudeArray.length; i++) {
							const lat = verbatimLatitudeArray[i]!;
							const lng = verbatimLongitudeArray[i]!;

							bounds[0][0] = Math.max(lat, bounds[0][0]);
							bounds[0][1] = Math.max(lng, bounds[0][1]);
							bounds[1][0] = Math.min(lat, bounds[1][0]);
							bounds[1][1] = Math.min(lng, bounds[1][1]);

							polylines.push([lat, lng]);
						}
					}

					filteredLocations.push({ ...loc, polylines });
				}
			} else {
				noLocationPoints.push(nullLoc);
			}

			if (nullLoc.userDefined) {
				for (const opt in nullLoc.userDefined) {
					userDefinedOptions.add(opt);
				}
			}
		}

		//check if all points are in the same spot
		if (bounds[0][0] === bounds[1][0] && bounds[0][1] === bounds[1][1]) {
			mapProps = {
				center: [bounds[0][0], bounds[0][1]] as unknown as LatLng,
				zoom: 5
			};
		} else {
			mapProps = { bounds };
		}
	}
	const defaultMapProps = { ...mapProps };

	let defaultLegend = undefined as LegendInfo;
	let pointsOrGroups;
	if (titleTable) {
		const titleId = TableMetadata[titleTable].titleField;

		//assign color to each option
		const optionsArray = Array.from(defaultOptions).sort(legendValueSort);
		const colors = distinctColors({ count: optionsArray.length, chromaMin, lightMin });
		const colorMap = optionsArray.reduce((acc, opt, i) => ({ ...acc, [opt]: colors[i]! }), {} as Record<string, Color>);
		defaultLegend = { field: titleId, mode: "discreet", colorMap };

		//assemble locations object with assigned color and list of locations
		pointsOrGroups = {} as Record<string, MapLocationWithValues[]>;
		for (const loc of filteredLocations) {
			const opt = getLegendValue(titleId, loc, userDefinedOptions);
			if (pointsOrGroups[opt]) {
				pointsOrGroups[opt].push(loc);
			} else {
				pointsOrGroups[opt] = [loc];
			}
		}
	} else {
		pointsOrGroups = filteredLocations;
	}
	const reducedPoints = titleTable
		? Object.values(pointsOrGroups).reduce((acc, arr) => [...acc, ...arr], [])
		: pointsOrGroups;

	//make legend options follow fieldOrder
	const legendOptions = [];
	if (TableMetadata[table].fieldOrder) {
		legendOptions.push(...TableMetadata[table].fieldOrder);
		for (const opt of TableMetadata[table].enumSchema.options) {
			if (!TableMetadata[table].fieldOrder.includes(opt) && !omit.includes(opt)) {
				legendOptions.push(opt);
			}
		}
	} else {
		for (const opt of TableMetadata[table].enumSchema.options) {
			if (!omit.includes(opt)) {
				legendOptions.push(opt);
			}
		}
	}
	if (userDefinedOptions.size) {
		legendOptions.push(...userDefinedOptions);
	}

	if (defaultLegendField && legendOptions.includes(defaultLegendField)) {
		defaultLegend = getMapLegendField({
			field: defaultLegendField,
			userDefinedOptions,
			reducedPoints,
			table,
			legendInfo: defaultLegend
		});
	}

	return {
		userDefinedOptions,
		defaultLegend,
		filteredLocations,
		mapProps,
		defaultMapProps,
		pointsOrGroups,
		noLocationPoints,
		legendOptions,
		reducedPoints
	};
}
