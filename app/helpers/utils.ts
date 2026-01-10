import { RanksBySpecificity } from "@/types/objects";
import { Prisma, Taxonomy } from "@/app/generated/prisma/client";
import distinctColors from "distinct-colors";
import { Circle, Location, LocationWithValues, MapShape, Point, Polygon } from "@/types/globals";

export async function fetcher(url: string) {
	const res = await fetch(url);
	if (!res.ok) {
		const data = await res.json();
		return { error: data.error };
	}
	return await res.json();
}

//export function getBaseUrl() {
//	if (process.env.NODE_ENV === "development") {
//		return "http://localhost:3000/";
//	}
//	return "https://opaldb.vercel.app/";
//}

//export function getRemoteUrl() {
//	if (process.env.NODE_ENV === "development") {
//		return "http://localhost:8080";
//	}
//	return "https://opalserver-qnwedardvq-uc.a.run.app";
//}

export function randomColors(count: number) {
	const colors = distinctColors({ count });

	return colors.map((c) => {
		const rgb = c.rgb();
		return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`;
	});
}

export function generateThemedColors(count: number, baseColor: string): string[] {
	const colors: string[] = [];
	const [baseR, baseG, baseB] = baseColor.match(/\d+/g)!.map(Number);

	for (let i = 0; i < count; i++) {
		const factor = 1 - i / (count * 1.5);
		const r = Math.max(0, Math.min(255, Math.floor(baseR * factor)));
		const g = Math.max(0, Math.min(255, Math.floor(baseG * factor)));
		const b = Math.max(0, Math.min(255, Math.floor(baseB * factor)));
		colors.push(`rgb(${r},${g},${b})`);
	}

	return colors;
}

export function generateChartColors(count: number): string[] {
	const primary = "rgb(100, 171, 220)";
	const secondary = "rgb(35, 61, 127)";
	const colors: string[] = [];

	if (count === 0) {
		return colors;
	}

	if (count === 1) {
		return [primary];
	}

	colors.push(primary, secondary);

	const generateShade = (color: string, factor: number) => {
		const [r, g, b] = color.match(/\d+/g)!.map(Number);
		const newR = Math.max(0, Math.min(255, Math.floor(r * factor)));
		const newG = Math.max(0, Math.min(255, Math.floor(g * factor)));
		const newB = Math.max(0, Math.min(255, Math.floor(b * factor)));
		return `rgb(${newR},${newG},${newB})`;
	};

	for (let i = 2; i < count; i++) {
		const factor = 1 - (i - 1) / (count * 1.5);
		if (i % 2 === 0) {
			colors.push(generateShade(primary, factor));
		} else {
			colors.push(generateShade(secondary, factor));
		}
	}

	return colors;
}

export function getMostSpecificRank(taxonomy: Taxonomy) {
	for (const rank of RanksBySpecificity) {
		if (taxonomy[rank]) {
			return { rank, label: taxonomy[rank] as string };
		}
	}

	return { rank: "taxonomy", label: taxonomy.taxonomy };
}

//handles converting numbers from 0 to 99
function stringToNumber(str: string) {
	const NUMBERS = {
		ZERO: 0,
		ONE: 1,
		TWO: 2,
		THREE: 3,
		FOUR: 4,
		FIVE: 5,
		SIX: 6,
		SEVEN: 7,
		EIGHT: 8,
		NINE: 9,
		TEN: 10,
		ELEVEN: 11,
		TWELVE: 12,
		THIRTEEN: 13,
		FOURTEEN: 14,
		FIFTEEN: 15,
		SIXTEEN: 16,
		SEVENTEEN: 17,
		EIGHTEEN: 18,
		NINETEEN: 19,
		TWENTY: 20,
		THIRTY: 30,
		FOURTY: 40,
		FIFTY: 50,
		SIXTY: 60,
		SEVENTY: 70,
		EIGHTY: 80,
		NINETY: 90
	} as Record<string, number>;

	const ENDING = "__";
	const SEP = "_";

	const words = str.toString().split(ENDING);
	if (words.length === 1) {
		return str;
	}

	let num = 0;
	let replace = "";

	words[0].split(SEP).forEach((word) => {
		if (word in NUMBERS) {
			num += NUMBERS[word];

			if (replace === "") {
				replace += word;
			} else {
				replace += SEP + word;
			}
		}
	});

	if (replace === "") {
		return str;
	} else {
		return str.replace(replace + ENDING, num.toString());
	}
}

export function deadBooleanToString(value: any) {
	return stringToNumber(value)
		.replaceAll("PAREN1_", "(")
		.replaceAll("PAREN2_", ")")
		.replaceAll("PERCENT_", "%")
		.replaceAll("COLON__", ": ")
		.replaceAll("__", "-")
		.replaceAll("_", " ");
}

export function parseNestedJson(json: string) {
	let parsed;

	try {
		parsed = JSON.parse(json); // object -> object, array -> array, number -> number, string -> catch block
	} catch {
		return json;
	}

	if (typeof parsed === "object") {
		if (Array.isArray(parsed)) {
			for (let i = 0; i < parsed.length; i++) {
				parsed[i] = parseNestedJson(parsed[i] as string);
			}
		} else {
			for (const [key, value] of Object.entries(parsed)) {
				parsed[key] = parseNestedJson(value as string);
			}
		}
	}

	return parsed;
}

export function getOptions(arr: Record<string, any>[]) {
	//create object of sets with keys matching arr
	const filterOptionsSet = {} as Record<keyof (typeof arr)[0], Set<any>>;
	for (let field in arr[0]) {
		filterOptionsSet[field as keyof (typeof arr)[0]] = new Set();
	}

	//fill sets with all possible values
	for (let e of arr) {
		for (let [field, value] of Object.entries(e)) {
			if (value) {
				filterOptionsSet[field as keyof typeof e].add(value);
			}
		}
	}

	//convert sets to arrays
	const filterOptions = {} as Record<keyof (typeof arr)[0], any[]>;
	for (let e in filterOptionsSet) {
		filterOptions[e as keyof typeof filterOptions] = Array.from(
			filterOptionsSet[e as keyof typeof filterOptionsSet]
		).sort();
	}

	return filterOptions;
}

function isObject(item: any) {
	return item && typeof item === "object" && !Array.isArray(item);
}

export function deepMerge(target: Record<string, any>, ...sources: Record<string, any>[]) {
	if (!sources.length) return target;
	const source = sources.shift();

	if (isObject(target) && isObject(source)) {
		for (const key in source) {
			if (isObject(source[key])) {
				if (!target[key]) Object.assign(target, { [key]: {} });
				deepMerge(target[key], source[key]);
			} else {
				Object.assign(target, { [key]: source[key] });
			}
		}
	}

	return deepMerge(target, ...sources);
}

export function uncapitalizeTable(table: Prisma.ModelName) {
	return (table.slice(0, 1).toLowerCase() + table.slice(1)) as Uncapitalize<Prisma.ModelName>;
}

export function capitalizeTable(table: Uncapitalize<Prisma.ModelName>) {
	return (table.slice(0, 1).toUpperCase() + table.slice(1)) as Prisma.ModelName;
}

export function getSubmissionFileName(value: string) {
	const url = new URL(value);
	if (url.origin.endsWith("blob.vercel-storage.com") && url.pathname.startsWith("/submissions")) {
		//reassemble file name without the random suffix
		const splitPath = url.pathname.split("/");
		const name = splitPath[splitPath.length - 1];
		const dashSplit = name.split("-"); //file name
		const dotSplit = name.split("."); //file type
		return decodeURIComponent(dashSplit.slice(0, dashSplit.length - 1).join("-")) + "." + dotSplit[dotSplit.length - 1];
	} else {
		//do nothing
		return value;
	}
}

//black magic do not touch
function __unfocus() {
	const el = document.getElementById("unfocusButton");
	if (el) {
		el.focus();
		el.blur();
	}
}

export function unfocus() {
	__unfocus();
}

function measure(lat1: number, lon1: number, lat2: number, lon2: number) {
	// generally used geo measurement function
	var R = 6378.137; // Radius of earth in KM
	var dLat = (lat2 * Math.PI) / 180 - (lat1 * Math.PI) / 180;
	var dLon = (lon2 * Math.PI) / 180 - (lon1 * Math.PI) / 180;
	var a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c;
	return d * 1000; // meters
}

function Turn(p1: Point, p2: Point, p3: Point) {
	const a = (p3.lat - p1.lat) * (p2.lng - p1.lng);
	const b = (p2.lat - p1.lat) * (p3.lng - p1.lng);
	return a > b + Number.EPSILON ? 1 : a + Number.EPSILON < b ? -1 : 0;
}

function isIntersecting(p1: Point, p2: Point, p3: Point, p4: Point) {
	return Turn(p1, p3, p4) != Turn(p2, p3, p4) && Turn(p1, p2, p3) != Turn(p1, p2, p4);
}

export function getLocationsInsideShapes(locs: (Location | LocationWithValues)[], shapes: MapShape[]) {
	const locsInside = [] as Location[];
	for (const l of locs) {
		for (const s of shapes) {
			if (s.type === "polygon") {
				//check if point is inside bounding box
				if (
					l.decimalLatitude < s.bounds.ne.lat &&
					l.decimalLatitude > s.bounds.sw.lat &&
					l.decimalLongitude < s.bounds.ne.lng &&
					l.decimalLongitude > s.bounds.sw.lng
				) {
					//create ray to cast through polygon
					const raycastLine = [
						{ lat: s.bounds.sw.lat - Number.EPSILON, lng: l.decimalLongitude },
						{ lat: l.decimalLatitude, lng: l.decimalLongitude }
					] as [Point, Point];

					//get sides of polygon
					const sides = [] as [Point, Point][];
					for (let i = 0; i < s.points.length; i++) {
						//last point connects to first point
						if (i === s.points.length - 1) {
							sides.push([s.points[i], s.points[0]]);
						} else {
							sides.push([s.points[i], s.points[i + 1]]);
						}
					}

					//get number of times the ray intersects with the polygon
					let numIntersections = 0;
					for (const s of sides) {
						if (isIntersecting(...raycastLine, ...s)) {
							numIntersections++;
						}
					}

					if (numIntersections % 2) {
						//number of intersections is odd, meaning the point lies in the polygon
						if (l.values) {
							locsInside.push(...l.values);
						} else {
							locsInside.push(l as Location);
						}
						break;
					}
				}
			} else if (s.type === "circle") {
				//check if point inside of circle
				const distance = measure(s.center.lat, s.center.lng, l.decimalLatitude, l.decimalLongitude);
				if (distance <= s.radius) {
					if (l.values) {
						locsInside.push(...l.values);
					} else {
						locsInside.push(l as Location);
					}
					break;
				}
			}
		}
	}

	return locsInside;
}

function stringToPolygon(poly: string): Polygon {
	//format: <lat>/<lng>,<lat>/<lng>,...
	const points = poly.split(",").map((p) => {
		const split = p.split("/");
		if (split.length !== 2) {
			throw new Error(`Invalid LatLng format: "${p}". Format must be <lat>/<lng>.`);
		}
		const pnt = {
			lat: parseFloat(split[0]),
			lng: parseFloat(split[1])
		};
		if (isNaN(pnt.lat) || Math.abs(pnt.lat) > 90) {
			throw new Error(`Invalid format for Lat: "${pnt.lat}". Lat must be a number between -90 and 90.`);
		}
		if (isNaN(pnt.lng) || Math.abs(pnt.lat) > 180) {
			throw new Error(`Invalid format for Lng: "${pnt.lng}". Lng must be a number between -180 and 180.`);
		}

		return pnt;
	});

	const bounds = { sw: { lat: -90, lng: -180 }, ne: { lat: 90, lng: 180 } };
	for (const p of points) {
		bounds.sw.lat = Math.min(p.lat, bounds.sw.lat);
		bounds.sw.lng = Math.min(p.lng, bounds.sw.lng);
		bounds.ne.lat = Math.max(p.lat, bounds.ne.lat);
		bounds.ne.lng = Math.max(p.lng, bounds.ne.lng);
	}

	return {
		type: "polygon",
		bounds,
		points
	};
}

function stringToCircle(circle: string): Circle {
	//format: <lat>/<lng>,<radius>
	const split = circle.split(",");
	if (split.length !== 2) {
		throw new Error(
			`Invalid circle format: "${circle}". Circle must have a center followed by a radius, separated by a comma.`
		);
	}

	const centerSplit = split[0].split("/");
	if (split.length !== 2) {
		throw new Error(`Invalid center format: "${split[0]}". Format must be <lat>/<lng>.`);
	}
	const center = {
		lat: parseFloat(centerSplit[0]),
		lng: parseFloat(centerSplit[1])
	};
	if (isNaN(center.lat) || Math.abs(center.lat) > 90) {
		throw new Error(`Invalid format for Lat: "${center.lat}". Lat must be a number between -90 and 90.`);
	}
	if (isNaN(center.lng) || Math.abs(center.lat) > 180) {
		throw new Error(`Invalid format for Lng: "${center.lng}". Lng must be a number between -180 and 180.`);
	}

	const radius = parseFloat(split[1]);
	if (isNaN(radius)) {
		throw new Error(`Invalid format for radius: "${split[1]}". Radius must be a number.`);
	}

	return {
		type: "circle",
		radius,
		center
	};
}

export function getShapesFromUrl(searchParams: URLSearchParams) {
	const polygons = searchParams.getAll("polygon");
	const circles = searchParams.getAll("circle");
	// Only process shapes if at least one polygon or circle was provided
	if (polygons.length || circles.length) {
		const shapes = [] as Array<MapShape>;

		for (const poly of polygons) {
			shapes.push(stringToPolygon(poly));
		}
		for (const cir of circles) {
			shapes.push(stringToCircle(cir));
		}

		return shapes;
	}
}

const rounding = 10000;
export function polygonToString(poly: Polygon) {
	return poly.points
		.map((p) => Math.floor(p.lat * rounding) / rounding + "/" + Math.floor(p.lng * rounding) / rounding)
		.join(",");
}

export function circleToString(circle: Circle) {
	return (
		Math.floor(circle.center.lat * rounding) / rounding +
		"/" +
		Math.floor(circle.center.lng * rounding) / rounding +
		"," +
		Math.floor(circle.radius * rounding) / rounding
	);
}

export function getTextColorHex(hex: string) {
	if (hex.indexOf("#") === 0) {
		hex = hex.slice(1);
	}
	// convert 3-digit hex to 6-digits.
	if (hex.length === 3) {
		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
	}
	if (hex.length !== 6) {
		throw new Error("Invalid HEX color.");
	}
	var r = parseInt(hex.slice(0, 2), 16),
		g = parseInt(hex.slice(2, 4), 16),
		b = parseInt(hex.slice(4, 6), 16);

	return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? "black" : "white";
}
