"use client";

import { MapContainer, TileLayer, Marker, Popup, FeatureGroup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { divIcon, DomEvent, LatLng, LatLngBoundsExpression, FeatureGroup as LFeatureGroup } from "leaflet";
import { FullscreenControl } from "react-leaflet-fullscreen";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "react-leaflet-fullscreen/styles.css";
import "react-leaflet-markercluster/styles";
import Link from "next/link";
import { Dispatch, ReactNode, SetStateAction, useEffect, useRef, useState } from "react";
import { Prisma } from "@/app/generated/prisma/client";
import TableMetadata from "@/types/tableMetadata";
import { EditControl } from "react-leaflet-draw-next";
import { capitalizeTable } from "@/app/helpers/utils";
import { LocationWithValues, Location, NullLocation } from "@/types/globals";
import InfoButton from "../InfoButton";
import chroma, { Color } from "chroma-js";
import distinctColors from "distinct-colors";
import { DeadValueEnum, DeadValueNumbers } from "@/types/enums";
import { GlobalOmit } from "@/types/objects";
import { getZodType } from "@/app/helpers/schema";

type MapProps =
	| {
			center: LatLng;
			zoom: number;
	  }
	| {
			bounds: LatLngBoundsExpression;
	  };

type Point = { lat: number; lng: number };

type Bounds = [[number, number], [number, number]];

type LegendInfo =
	| ({ field: string | string[] } & (
			| { mode: "discreet"; colorMap: Record<string, Color>; hidden?: string[] }
			| { mode: "gradient"; range: [number, number] | [Date, Date]; palette: string }
	  ))
	| undefined;

const DEFAULT_COLOR = chroma("red");
const DEFAULT_OUTSIDE_COLOR = chroma("black");
const DEFAULT_PALETTE = "YlGnBu";
const DEFAULT_POINT_SIZE = 15;
const DEFAULT_POINT_SIZE_STEP = 10;
const DEFAULT_CLUSTER_RADIUS = 50;
const chromaMin = 35;

function getShape(shape: any) {
	if (shape.layerType === "polygon") {
		return {
			type: shape.layerType,
			bounds: {
				ne: shape.layer.getBounds().getNorthEast(),
				sw: shape.layer.getBounds().getSouthWest()
			},
			points: shape.layer.getLatLngs()[0]
		};
	} else if (shape.layerType === "circle") {
		return {
			type: shape.layerType,
			center: shape.layer.getLatLng(),
			radius: shape.layer.getRadius()
		};
	}
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

function getTitleIdValue(
	titleId: (typeof TableMetadata)[keyof typeof TableMetadata]["titleField"],
	loc: LocationWithValues | Location,
	sep = "/"
) {
	if (typeof titleId === "string") {
		return loc[titleId];
	} else {
		let joined = "";
		for (let i = 0; i < titleId.length; i++) {
			if (i) {
				joined += sep;
			}
			joined += loc[titleId[i]];
		}
		return joined;
	}
}

function getLegendColor(legendInfo: LegendInfo, loc: LocationWithValues | Location) {
	if (legendInfo) {
		if (legendInfo.mode === "discreet") {
			const titleIdVal = getTitleIdValue(legendInfo.field, loc);
			if (titleIdVal) {
				return legendInfo.colorMap[titleIdVal];
			}
		} else if (legendInfo.mode === "gradient") {
			const val = loc[legendInfo.field as string] as number | Date;
			let percent;
			if (typeof val === "number") {
				const range = legendInfo.range as [number, number];
				percent = (val - range[0]) / (range[1] - range[0]);
			} else {
				const range = legendInfo.range as [Date, Date];
				percent = (val.getTime() - range[0].getTime()) / (range[1].getTime() - range[0].getTime());
			}

			if (percent >= 0 && percent <= 100) {
				return chroma.scale(legendInfo.palette)(percent);
			}
		}
	}

	return DEFAULT_COLOR;
}

function getTextColorHex(hex: string) {
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

//TODO: make gradient scale with number of options
function getConicGradient(colors: chroma.Color[]) {
	return `conic-gradient(from ${360 / colors.length}deg,${colors
		.map((c, i) => `${c.hex()} 0% ${(100 / colors.length) * (i + 1)}%`)
		.join(",")});`;
}

function Turn(p1: Point, p2: Point, p3: Point) {
	const a = (p3.lat - p1.lat) * (p2.lng - p1.lng);
	const b = (p2.lat - p1.lat) * (p3.lng - p1.lng);
	return a > b + Number.EPSILON ? 1 : a + Number.EPSILON < b ? -1 : 0;
}

function isIntersecting(p1: Point, p2: Point, p3: Point, p4: Point) {
	return Turn(p1, p3, p4) != Turn(p2, p3, p4) && Turn(p1, p2, p3) != Turn(p1, p2, p4);
}

function getMarkerHtml(count: number, valuesCount: number, combined: number, style: string, borderStyle?: string) {
	const sharedStyles = "h-full w-full rounded-full";
	const borderStyles = "border border-black";
	const tooltipStyles = "tooltip tooltip-secondary before:text-primary-content";

	if (count === 1 && !valuesCount) {
		return `<div class='${sharedStyles} ${borderStyles}' style='${style}'></div>`;
	} else {
		if (count === 1) {
			return `<div class='${sharedStyles} ${borderStyles} ${tooltipStyles}' data-tip='${valuesCount}' style='${style}'></div>`;
		} else {
			if (borderStyle) {
				return (
					`<div class='p-1 ${sharedStyles} ${tooltipStyles}' data-tip='${combined}' style='${borderStyle}'>` +
					`<div class='${sharedStyles}' style='${style}'></div>` +
					`</div>`
				);
			}
			return `<div class='border-4 border-white/40 ${sharedStyles} ${tooltipStyles}' data-tip='${combined}' style='${style}'></div>`;
		}
	}
}

export default function ActualMap({
	locations,
	id = "samp_name",
	table = "sample",
	titleTable,
	cluster = false,
	clusterRadius,
	legend = false,
	draw = false,
	legendOmit = []
}: {
	locations: NullLocation[];
	id?: string;
	table?: Uncapitalize<Prisma.ModelName>;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	cluster?: boolean;
	clusterRadius?: number;
	legend?: boolean;
	draw?: boolean;
	legendOmit?: string[];
}) {
	const [drawAlmostReady, setDrawAlmostReady] = useState(false);
	const [drawReady, setDrawReady] = useState(false);

	const featureGroupRef = useRef<LFeatureGroup>(null);

	//clump locations if they have identical latlng
	let filteredLocations = [] as Array<Location | LocationWithValues>;
	//track points with invalid location data
	let noLocationPoints = [] as NullLocation[];
	//calculate starting map view
	let mapProps = {} as MapProps;
	//legend options
	const defaultOptions = new Set() as Set<string>;

	const DEFAULT_BOUNDS = [
		[-180, -180],
		[180, 180]
	] as Bounds;

	if (locations.length === 1) {
		if (
			locations[0].decimalLatitude !== null &&
			locations[0].decimalLongitude !== null &&
			!(locations[0].decimalLatitude! in DeadValueEnum) &&
			!(locations[0].decimalLongitude! in DeadValueEnum)
		) {
			mapProps = {
				center: [locations[0].decimalLatitude, locations[0].decimalLongitude] as [number, number] as unknown as LatLng,
				zoom: 5
			};

			filteredLocations.push(locations[0] as Location);
		} else {
			noLocationPoints.push(locations[0]);
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
				const loc = { ...nullLoc } as Location;

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
						filteredLocations[foundIndex].values = [{ ...filteredLocations[foundIndex] } as Location, loc];
					}
				} else {
					bounds[0][0] = Math.max(loc.decimalLatitude, bounds[0][0]);
					bounds[0][1] = Math.max(loc.decimalLongitude, bounds[0][1]);
					bounds[1][0] = Math.min(loc.decimalLatitude, bounds[1][0]);
					bounds[1][1] = Math.min(loc.decimalLongitude, bounds[1][1]);

					if (titleTable) {
						defaultOptions.add(getTitleIdValue(TableMetadata[titleTable].titleField, loc));
					}

					filteredLocations.push(loc);
				}
			} else {
				noLocationPoints.push(nullLoc);
			}
		}

		mapProps = { bounds };
	}

	let defaultLegend = undefined as LegendInfo;
	let pointsOrGroups;
	if (titleTable) {
		const titleId = TableMetadata[titleTable].titleField;

		//assign color to each option
		const optionsArray = Array.from(defaultOptions);
		const colors = distinctColors({ count: optionsArray.length, chromaMin });
		const colorMap = {} as Record<string, Color>;
		for (let i = 0; i < optionsArray.length; i++) {
			colorMap[optionsArray[i]] = colors[i];
		}
		defaultLegend = { field: titleId, mode: "discreet", colorMap };

		//assemble locations object with assigned color and list of locations
		pointsOrGroups = {} as Record<string, LocationWithValues[]>;
		for (const loc of filteredLocations) {
			const opt = getTitleIdValue(titleId, loc);
			if (pointsOrGroups[opt]) {
				pointsOrGroups[opt].push(loc);
			} else {
				pointsOrGroups[opt] = [loc];
			}
		}
	} else {
		pointsOrGroups = filteredLocations;
	}
	const [legendInfo, setLegendInfo] = useState(defaultLegend);
	const [loading, setLoading] = useState(false);
	const [pointsInside, setPointsInside] = useState([] as Location[]);

	const [pointSize, setPointSize] = useState(DEFAULT_POINT_SIZE as number | undefined);
	const [pointSizeStep, setPointSizeStep] = useState(DEFAULT_POINT_SIZE_STEP as number | undefined);
	const [clusterRadiusValue, setClusterRadiusValue] = useState(
		(clusterRadius || DEFAULT_CLUSTER_RADIUS) as number | undefined
	);

	const [shapes, setShapes] = useState(
		{} as Record<
			string,
			| {
					type: "polygon";
					bounds: {
						ne: Point;
						sw: Point;
					};
					points: Point[];
			  }
			| {
					type: "circle";
					center: Point;
					radius: number;
			  }
		>
	);

	function checkShapes() {
		const tempPointsInside = [] as Location[];

		if (Object.keys(shapes).length) {
			for (const l of filteredLocations) {
				//exclude locations hidden by legend
				if (
					!(legendInfo && legendInfo.mode === "discreet" && legendInfo.hidden?.includes(l[legendInfo.field as string]))
				) {
					//test every shape
					for (const s of Object.values(shapes)) {
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
										tempPointsInside.push(...l.values);
									} else {
										tempPointsInside.push(l as Location);
									}
									break;
								}
							}
						} else if (s.type === "circle") {
							//check if point inside of circle
							const distance = measure(s.center.lat, s.center.lng, l.decimalLatitude, l.decimalLongitude);
							if (distance <= s.radius) {
								if (l.values) {
									tempPointsInside.push(...l.values);
								} else {
									tempPointsInside.push(l as Location);
								}
								break;
							}
						}
					}
				}
			}
		}

		setPointsInside(tempPointsInside);
	}

	//shapes
	useEffect(() => {
		if (drawReady) {
			checkShapes();
		}
	}, [shapes]);

	//waiting until the ref is set, for some reason the ref won't work as a dependency, so wait 2 cycles of rendering to render the draw feature group
	useEffect(() => {
		if (!drawAlmostReady) {
			setDrawAlmostReady(true);
		} else if (!drawReady) {
			setDrawReady(true);
		}
	}, [drawAlmostReady]);

	useEffect(() => {
		checkShapes();
		setLoading(false);
	}, [legendInfo]);

	function ClusterGroup({ radius, children }: { radius: number | undefined; children: ReactNode }) {
		return (
			<MarkerClusterGroup
				maxClusterRadius={radius || 0}
				singleMarkerMode={true}
				chunkedLoading={true}
				iconCreateFunction={(cluster: any) => {
					let count = 0;
					let childrenWithValues = 0;
					let valuesCount = 0;
					let outsideShapesCount = 0;
					const uniqueColors = new Set() as Set<string>;
					const colorsArray = [] as string[];
					for (const marker of cluster.getAllChildMarkers()) {
						count++;

						const loc = marker.options.children.props.loc;
						if (loc.values) {
							childrenWithValues++;
							valuesCount += loc.values.length;

							//check if location is outside any drawn shapes
							if (
								Object.keys(shapes).length &&
								pointsInside &&
								pointsInside.find((p) => p[id] === loc[id]) === undefined
							) {
								outsideShapesCount += loc.values.length;
							} else {
								for (const val of loc.values) {
									const color = getLegendColor(legendInfo, val);
									const c = color ? color.hex() : DEFAULT_COLOR.hex();
									uniqueColors.add(c);
									colorsArray.push(c);
								}
							}
						} else {
							//check if location is outside any drawn shapes
							if (
								Object.keys(shapes).length &&
								pointsInside &&
								pointsInside.find((p) => p[id] === loc[id]) === undefined
							) {
								outsideShapesCount++;
							} else {
								const color = getLegendColor(legendInfo, loc);
								const c = color ? color.hex() : DEFAULT_COLOR.hex();
								uniqueColors.add(c);
								colorsArray.push(c);
							}
						}
					}

					const combined = childrenWithValues ? count - childrenWithValues + valuesCount : count;

					let size =
						(pointSize || DEFAULT_POINT_SIZE) +
						(pointSizeStep || DEFAULT_POINT_SIZE_STEP) * (Math.floor(combined).toString().length - 1);
					if (count > 1) {
						//TODO: make border size a percentage of current size
						size += 5;
					}

					let html;
					if ((uniqueColors.size === 1 && !outsideShapesCount) || (!uniqueColors.size && outsideShapesCount)) {
						//only one color, no gradient
						let color;
						if (outsideShapesCount) {
							color = DEFAULT_OUTSIDE_COLOR.hex();
						} else {
							color = Array.from(uniqueColors)[0];
						}

						html = getMarkerHtml(count, valuesCount, combined, `background-color:${color}`);
					} else {
						//more than one color, display as gradient
						let orderedColors;

						if (legendInfo?.mode === "discreet") {
							orderedColors = Object.values(legendInfo.colorMap).filter((color) => uniqueColors.has(color.hex()));
						} else {
							orderedColors = Array.from(uniqueColors).map((c) => chroma(c));
						}

						//move first color to end because conic gradient doesn't start at 12 o'clock
						orderedColors.push(orderedColors.shift() as chroma.Color);

						//account for points outside of drawn shapes
						if (outsideShapesCount) {
							orderedColors.push(DEFAULT_OUTSIDE_COLOR);
						}

						html = getMarkerHtml(
							count,
							valuesCount,
							combined,
							`background:${getConicGradient(orderedColors)}`,
							`background:${getConicGradient(orderedColors.map((color) => color.mix("white", 0.4, "oklab")))}`
						);
					}

					return divIcon({
						className: "bg-none",
						html,
						iconSize: [size, size]
					});
				}}
			>
				{children}
			</MarkerClusterGroup>
		);
	}

	const legendProps = titleTable
		? { titleTable, points: pointsOrGroups as Record<string, LocationWithValues[]> }
		: { titleTable: undefined, points: pointsOrGroups as LocationWithValues[] };

	//make legend options follow fieldOrder
	const legendOptions = [];
	const includeOpt = (opt: string) => !GlobalOmit.includes(opt) && !legendOmit.includes(opt) && opt !== "id";
	if (TableMetadata[table].fieldOrder) {
		legendOptions.push(...TableMetadata[table].fieldOrder);
		for (const opt of TableMetadata[table].enumSchema.options) {
			if (!(TableMetadata[table].fieldOrder && TableMetadata[table].fieldOrder.includes(opt)) && includeOpt(opt)) {
				legendOptions.push(opt);
			}
		}
	} else {
		for (const opt of TableMetadata[table].enumSchema.options) {
			if (includeOpt(opt)) {
				legendOptions.push(opt);
			}
		}
	}

	return (
		<div className="flex flex-col items-start h-full w-full z-100 relative">
			<MapContainer
				preferCanvas={false}
				maxBounds={
					[
						[-180, -180],
						[180, 180]
					] as LatLngBoundsExpression
				}
				className="w-full h-full grow"
				{...mapProps}
			>
				<FullscreenControl />

				<div className="leaflet-top leaflet-left pt-25">
					<NoLocationPointsControl noLocationPoints={noLocationPoints} table={table} id={id} legendInfo={legendInfo} />
				</div>
				<div className="leaflet-top leaflet-right pt-37">
					{pointsInside.length ? (
						<DrawSelectedControl pointsInside={pointsInside} table={table} id={id} legendInfo={legendInfo} />
					) : (
						<></>
					)}
				</div>
				<div className="leaflet-bottom leaflet-left">
					<ClusterControl
						cluster={cluster}
						value={clusterRadiusValue}
						onChange={setClusterRadiusValue}
						clusterRadius={clusterRadius}
					/>
					<PointSizeControl
						pointSize={pointSize}
						setPointSize={setPointSize}
						pointSizeStep={pointSizeStep}
						setPointSizeStep={setPointSizeStep}
					/>
				</div>
				<div className="leaflet-bottom leaflet-right">
					<LegendControl
						legend={legend}
						legendInfo={legendInfo}
						setLegendInfo={setLegendInfo}
						setLoading={setLoading}
						legendOptions={legendOptions}
						table={table}
						{...legendProps}
					/>
				</div>

				<LoadingControl loading={loading} />

				<TileLayer
					attribution='Powered by <a href="https://www.esri.com/en-us/home" target="_blank">Esri</a>'
					url={`https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}?token=${process.env.ARCGIS_KEY}`}
				/>

				<FeatureGroup ref={featureGroupRef}>
					{draw && drawReady && featureGroupRef.current && (
						<EditControl
							position="topright"
							onEdited={(e) => {
								const temp = {} as typeof shapes;
								for (const edit of Object.keys(e.layers._layers)) {
									if (shapes[edit]) {
										temp[edit] = getShape({
											layerType: shapes[edit].type,
											layer: e.layers._layers[edit]
										}) as (typeof shapes)[keyof typeof shapes];
									}
								}
								if (Object.keys(temp).length) {
									setShapes({ ...shapes, ...temp });
								}
							}}
							onCreated={(e) => {
								setShapes({
									...shapes,
									[e.layer._leaflet_id]: getShape(e)
								});
							}}
							onDeleted={(e) => {
								const temp = { ...shapes };
								for (const del of Object.keys(e.layers._layers)) {
									delete temp[del];
								}
								setShapes(temp);
							}}
							draw={{
								rectangle: false,
								circle: true,
								polyline: false,
								polygon: true,
								marker: false,
								circlemarker: false
							}}
							featureGroup={featureGroupRef.current}
						/>
					)}
				</FeatureGroup>

				{Array.isArray(pointsOrGroups) ? (
					<ClusterGroup radius={cluster ? clusterRadiusValue : 0}>
						{pointsOrGroups.reduce((acc, loc, i) => {
							if (
								!(
									legendInfo &&
									legendInfo.mode === "discreet" &&
									legendInfo.hidden?.includes(loc[legendInfo.field as string])
								)
							) {
								acc.push(
									<Marker key={i} position={{ lat: loc.decimalLatitude, lng: loc.decimalLongitude }}>
										<PopupWithSearch table={table} titleTable={titleTable} loc={loc} id={id} legendInfo={legendInfo} />
									</Marker>
								);
							}

							return acc;
						}, [] as ReactNode[])}
					</ClusterGroup>
				) : (
					<>
						{Object.values(pointsOrGroups).map((locArray, i) => (
							<ClusterGroup key={i} radius={cluster ? clusterRadiusValue : 0}>
								{locArray.reduce((acc, loc, j) => {
									if (
										!(
											legendInfo &&
											legendInfo.mode === "discreet" &&
											legendInfo.hidden?.includes(loc[legendInfo.field as string])
										)
									) {
										acc.push(
											<Marker key={j} position={{ lat: loc.decimalLatitude, lng: loc.decimalLongitude }}>
												<PopupWithSearch
													table={table}
													titleTable={titleTable}
													loc={loc}
													id={id}
													legendInfo={legendInfo}
												/>
											</Marker>
										);
									}

									return acc;
								}, [] as ReactNode[])}
							</ClusterGroup>
						))}
					</>
				)}

				<style jsx global>{`
					.leaflet-popup-content-wrapper {
						padding: 0;
						border-radius: 0.5rem;
					}
					.leaflet-popup-content {
						margin: 0;
					}
					.leaflet-popup-tip {
						background: let(--fallback-b1, oklch(let(--b1))) !important;
						opacity: 1 !important;
					}
				`}</style>
			</MapContainer>
		</div>
	);
}

function PopupWithSearchBody({
	table,
	titleTable,
	loc,
	id,
	legendInfo,
	className
}: {
	table: Uncapitalize<Prisma.ModelName>;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	loc: LocationWithValues;
	id: string;
	legendInfo: LegendInfo;
	className?: string;
}) {
	const [filter, setFilter] = useState("");
	const [filteredValues, setFilteredValues] = useState(loc.values ? loc.values : undefined);

	useEffect(() => {
		if (loc.values) {
			const tempFilteredValues = [] as Location[];
			for (const l of loc.values) {
				if (l[id].toLowerCase().includes(filter.toLowerCase())) {
					tempFilteredValues.push(l);
				}
			}

			setFilteredValues(tempFilteredValues);
		}
	}, [filter]);

	return (
		<div className={`font-sans [:where(&)]:bg-base-100 [:where(&)]:rounded-lg [:where(&)]:p-3 ${className}`}>
			{titleTable && (
				<Link
					href={`/explore/${titleTable}/${
						typeof TableMetadata[titleTable].titleField === "string"
							? loc[TableMetadata[titleTable].titleField]
							: TableMetadata[titleTable].titleField.map((f) => loc[f]).join("/")
					}`}
					className="!w-auto !h-auto !bg-transparent !cursor-pointer !link-primary !link-hover !text-xl"
				>
					{typeof TableMetadata[titleTable].titleField === "string"
						? loc[TableMetadata[titleTable].titleField]
						: TableMetadata[titleTable].titleField.map((f) => loc[f]).join(" / ")}
				</Link>
			)}
			{loc.values ? (
				<input
					type="text"
					onChange={(e) => setFilter(e.target.value)}
					value={filter}
					placeholder={`Filter ${TableMetadata[table].plural}...`}
					className="input input-primary input-xs w-full flex-1 min-w-0 text-primary my-1"
				/>
			) : (
				<></>
			)}
			<>
				{loc.values ? (
					<>
						<h2 className="text-primary text-lg">
							{filteredValues!.length === 1 ? capitalizeTable(table) : TableMetadata[table].plural} (
							{filteredValues!.length})
						</h2>
						<div className="flex flex-col max-h-15 overflow-y-scroll overscroll-contain pr-5">
							{filteredValues!.map((l) => {
								if (legendInfo) {
									const color = getLegendColor(legendInfo, l);

									return (
										<div key={l[id]} className="flex gap-2 items-center">
											<div
												className="aspect-square w-[1em] h-[1em]"
												style={{ backgroundColor: color ? color.hex() : DEFAULT_COLOR.hex() }}
											></div>
											<Link
												href={`/explore/${table}/${encodeURIComponent(l[id])}`}
												className="!cursor-pointer !link-primary !link-hover  !leading-[1.3] text-xs"
											>
												{l[id]}
											</Link>
										</div>
									);
								} else {
									return (
										<Link
											key={l[id]}
											href={`/explore/${table}/${encodeURIComponent(l[id])}`}
											className="!cursor-pointer !link-primary !link-hover !border-none !leading-[1.3] text-xs"
										>
											{l[id]}
										</Link>
									);
								}
							})}
						</div>
					</>
				) : (
					<>
						<h2 className="text-primary text-lg">{capitalizeTable(table)}</h2>
						{legendInfo ? (
							<div className="flex gap-2 items-center">
								<div
									className="aspect-square w-[1em] h-[1em]"
									style={{
										backgroundColor: legendInfo ? getLegendColor(legendInfo, loc).hex() : DEFAULT_COLOR.hex()
									}}
								></div>
								<Link
									href={`/explore/${table}/${encodeURIComponent(loc[id])}`}
									className="!cursor-pointer !link-primary !link-hover !border-none !leading-[1.3] text-xs"
								>
									{loc[id]}
								</Link>
							</div>
						) : (
							<Link
								href={`/explore/${table}/${encodeURIComponent(loc[id])}`}
								className="!cursor-pointer !link-primary !link-hover !border-none !leading-[1.3] text-xs"
							>
								{loc[id]}
							</Link>
						)}
					</>
				)}
			</>
		</div>
	);
}

function PopupWithSearch({
	table,
	titleTable,
	loc,
	id,
	legendInfo
}: {
	table: Uncapitalize<Prisma.ModelName>;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	loc: LocationWithValues;
	id: string;
	legendInfo: LegendInfo;
}) {
	return (
		<Popup className="map-popup">
			<div className="card card-xs card-body justify-center min-h-[45px] min-w-[45px] bg-base-100 shadow-sm p-2">
				<PopupWithSearchBody table={table} titleTable={titleTable} loc={loc} id={id} legendInfo={legendInfo} />
			</div>
		</Popup>
	);
}

function Collapsible({
	children,
	defaultCollapse = false,
	hiddenText = "Show",
	dir = "right",
	className = ""
}: {
	children: ReactNode;
	defaultCollapse?: boolean;
	hiddenText?: string;
	dir?: "right" | "left" | "up" | "down";
	className?: string;
}) {
	const [collapse, setCollapse] = useState(defaultCollapse);
	const [delayedCollapse, setDelayedCollapse] = useState(defaultCollapse);

	//delay 2nd state variable by a render cycle to fix tooltip appearing immediately after collapsing
	useEffect(() => setDelayedCollapse(collapse), [collapse]);

	const panel = (
		<div
			className={`card card-xs card-body justify-center min-h-[45px] min-w-[45px] [:where(&)]:gap-0 [:where(&)]:bg-base-100 [:where(&)]:shadow-sm [:where(&)]:p-2 ${className} ${
				collapse ? "hidden" : ""
			}`}
		>
			{children}
		</div>
	);

	let rotationOpen;
	let rotationClosed;
	let flexDir;
	let tooltipDir;
	let collapsePos;
	let openRounded;

	if (dir === "right") {
		rotationOpen = "";
		rotationClosed = "rotate-180";
		flexDir = "flex-row";
		tooltipDir = "tooltip-left";
		collapsePos = "self-end";
		openRounded = "rounded-r-none pr-1";
	} else if (dir === "left") {
		rotationOpen = "rotate-180";
		rotationClosed = "";
		flexDir = "flex-row";
		tooltipDir = "tooltip-right";
		collapsePos = "self-start";
		openRounded = "rounded-l-none pl-1";
	} else if (dir === "up") {
		rotationOpen = "-rotate-90";
		rotationClosed = "rotate-90";
		flexDir = "flex-col";
		tooltipDir = "tooltip-bottom";
		collapsePos = "self-start";
		openRounded = "rounded-t-none pt-1";
	} else if (dir === "down") {
		rotationOpen = "rotate-90";
		rotationClosed = "-rotate-90";
		flexDir = "flex-col";
		tooltipDir = "tooltip-top";
		collapsePos = "self-end";
		openRounded = "rounded-b-none pb-1";
	}

	return (
		<div className={`flex ${flexDir} ${collapse ? collapsePos : ""}`}>
			{dir === "left" || dir === "up" ? panel : <></>}
			<div
				className={`card bg-base-100 card-xs shadow-sm card-body p-2 self-center justify-center cursor-pointer ${
					collapse ? "" : openRounded
				} ${delayedCollapse ? `tooltip ${tooltipDir} tooltip-secondary before:text-primary-content` : ""}`}
				data-tip={hiddenText}
				onClick={() => setCollapse(!collapse)}
			>
				{collapse ? (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						className={`text-primary ${rotationClosed}`}
						stroke="currentColor"
						fill="currentColor"
					>
						<g>
							<polygon points="11.707 3.293 10.293 4.707 17.586 12 10.293 19.293 11.707 20.707 20.414 12 11.707 3.293" />
							<polygon points="5.707 3.293 4.293 4.707 11.586 12 4.293 19.293 5.707 20.707 14.414 12 5.707 3.293" />
						</g>
					</svg>
				) : (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						className={`text-primary ${rotationOpen}`}
						stroke="currentColor"
						fill="currentColor"
					>
						<g>
							<polygon points="11.707 3.293 10.293 4.707 17.586 12 10.293 19.293 11.707 20.707 20.414 12 11.707 3.293" />
							<polygon points="5.707 3.293 4.293 4.707 11.586 12 4.293 19.293 5.707 20.707 14.414 12 5.707 3.293" />
						</g>
					</svg>
				)}
			</div>
			{dir === "right" || dir === "down" ? panel : <></>}
		</div>
	);
}

function ResetButton({
	disabled,
	dataTip,
	resetFunction,
	dir = "tooltip-top"
}: {
	disabled: boolean;
	dataTip: string;
	resetFunction: () => void;
	dir?: "tooltip-top" | "tooltip-bottom" | "tooltip-left" | "tooltip-right";
}) {
	return (
		<div className={`tooltip tooltip-secondary before:text-primary-content ${dir}`} data-tip={disabled ? "" : dataTip}>
			<svg
				width="20px"
				height="20px"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
				className={disabled ? "text-primary/25" : "text-primary cursor-pointer"}
				stroke="currentColor"
				fill="currentColor"
				onClick={resetFunction}
			>
				<path d="M12 16c1.671 0 3-1.331 3-3s-1.329-3-3-3-3 1.331-3 3 1.329 3 3 3z" />
				<path d="M20.817 11.186a8.94 8.94 0 0 0-1.355-3.219 9.053 9.053 0 0 0-2.43-2.43 8.95 8.95 0 0 0-3.219-1.355 9.028 9.028 0 0 0-1.838-.18V2L8 5l3.975 3V6.002c.484-.002.968.044 1.435.14a6.961 6.961 0 0 1 2.502 1.053 7.005 7.005 0 0 1 1.892 1.892A6.967 6.967 0 0 1 19 13a7.032 7.032 0 0 1-.55 2.725 7.11 7.11 0 0 1-.644 1.188 7.2 7.2 0 0 1-.858 1.039 7.028 7.028 0 0 1-3.536 1.907 7.13 7.13 0 0 1-2.822 0 6.961 6.961 0 0 1-2.503-1.054 7.002 7.002 0 0 1-1.89-1.89A6.996 6.996 0 0 1 5 13H3a9.02 9.02 0 0 0 1.539 5.034 9.096 9.096 0 0 0 2.428 2.428A8.95 8.95 0 0 0 12 22a9.09 9.09 0 0 0 1.814-.183 9.014 9.014 0 0 0 3.218-1.355 8.886 8.886 0 0 0 1.331-1.099 9.228 9.228 0 0 0 1.1-1.332A8.952 8.952 0 0 0 21 13a9.09 9.09 0 0 0-.183-1.814z" />
			</svg>
		</div>
	);
}

function LegendControl({
	legend,
	legendInfo,
	setLegendInfo,
	setLoading,
	legendOptions,
	points,
	table,
	titleTable
}: {
	legend: boolean;
	legendInfo: LegendInfo;
	setLegendInfo: Dispatch<SetStateAction<LegendInfo>>;
	setLoading: Dispatch<SetStateAction<boolean>>;
	legendOptions: string[];
	table: Uncapitalize<Prisma.ModelName>;
} & (
	| { titleTable: Uncapitalize<Prisma.ModelName>; points: Record<string, LocationWithValues[]> }
	| { titleTable?: undefined; points: LocationWithValues[] }
)) {
	const ref = useRef<HTMLDivElement>(null);

	const [filter, setFilter] = useState("");

	useEffect(() => {
		if (ref.current) {
			DomEvent.disableClickPropagation(ref.current);
			DomEvent.disableScrollPropagation(ref.current);
		}
	}, []);

	if (!legend) {
		return null;
	}

	return (
		<div className="leaflet-control leaflet-bar !border-none !mb-6 flex flex-col gap-2" ref={ref}>
			<Collapsible hiddenText="Show Legend" defaultCollapse={!legendInfo} className="py-3">
				<div className="text-lg flex justify-between items-center gap-2">
					{titleTable ? (
						// TODO: enable changing legend even with titleTable, keep clustering linked to titleTable
						<span className="pl-2">{TableMetadata[titleTable].plural}</span>
					) : (
						<>
							<ResetButton
								disabled={!legendInfo?.field}
								dataTip="Reset Legend"
								resetFunction={() => setLegendInfo(undefined)}
							/>

							<select
								value={legendInfo ? legendInfo.field : ""}
								onChange={async (e) => {
									const field = e.target.value;

									//give control back to browser to display loading
									setLoading(true);
									await new Promise((resolve) => setTimeout(resolve, 1));

									const shape = TableMetadata[table].schema.shape;
									const type = getZodType(shape[field as keyof typeof shape]).type;

									if (type === "string" || type === "DeadBoolean") {
										const options = new Set() as Set<any>;
										for (const loc of points) {
											if (loc.values) {
												for (const val of loc.values) {
													options.add(val[field]);
												}
											} else {
												options.add(loc[field]);
											}
										}
										const optionsArray = Array.from(options).sort();

										//check if invalid number of options
										if (optionsArray.length === 0 || (optionsArray.length === 1 && optionsArray[0] == null)) {
											setLegendInfo({ field, mode: "discreet", colorMap: {} });
											return;
										} else if (optionsArray.length === 1) {
											setLegendInfo({ field, mode: "discreet", colorMap: { [optionsArray[0]]: DEFAULT_COLOR } });
											return;
										} else {
											//valid
											const colors = distinctColors({ count: optionsArray.length, chromaMin });
											const colorMap = {} as Record<string, Color>;
											for (let i = 0; i < optionsArray.length; i++) {
												colorMap[optionsArray[i]] = colors[i];
											}

											setLegendInfo({ field, mode: "discreet", colorMap });
										}
									} else if (type === "integer" || type === "float") {
										let parser;
										if (type === "integer") {
											parser = parseInt;
										} else if (type === "float") {
											parser = parseFloat;
										}

										const options = new Set() as Set<any>;
										for (const loc of points) {
											if (loc.values) {
												for (const val of loc.values) {
													if (!DeadValueNumbers.includes(val[field])) {
														options.add(val[field]);
													}
												}
											} else {
												if (!DeadValueNumbers.includes(loc[field])) {
													options.add(loc[field]);
												}
											}
										}
										const optionsArray = Array.from(options).sort();

										//check if invalid number of options
										if (optionsArray.length === 0 || (optionsArray.length === 1 && optionsArray[0] == null)) {
											setLegendInfo({ field, mode: "discreet", colorMap: {} });
										} else if (optionsArray.length === 1) {
											setLegendInfo({ field, mode: "discreet", colorMap: { [optionsArray[0]]: DEFAULT_COLOR } });
										} else {
											//valid
											setLegendInfo({
												field,
												mode: "gradient",
												range: [optionsArray[0], optionsArray[optionsArray.length - 1]],
												palette: legendInfo?.mode === "gradient" ? legendInfo.palette : DEFAULT_PALETTE
											});
										}
									} else if (type === "date") {
										const options = new Set() as Set<any>;
										for (const loc of points) {
											if (loc.values) {
												for (const val of loc.values) {
													const time = val[field].getTime();
													if (!DeadValueNumbers.includes(time)) {
														options.add(time);
													}
												}
											} else {
												const time = loc[field].getTime();
												if (!DeadValueNumbers.includes(time)) {
													options.add(time);
												}
											}
										}
										const optionsArray = Array.from(options).sort();

										//check if invalid number of options
										if (
											optionsArray.length === 0 ||
											(optionsArray.length === 1 && (optionsArray[0] == null || isNaN(optionsArray[0])))
										) {
											setLegendInfo({ field, mode: "discreet", colorMap: {} });
										} else if (optionsArray.length === 1) {
											setLegendInfo({ field, mode: "discreet", colorMap: { [optionsArray[0]]: DEFAULT_COLOR } });
										} else {
											//valid
											setLegendInfo({
												field,
												mode: "gradient",
												range: [new Date(optionsArray[0]), new Date(optionsArray[optionsArray.length - 1])],
												palette: legendInfo?.mode === "gradient" ? legendInfo.palette : DEFAULT_PALETTE
											});
										}
									} else {
										setLegendInfo({
											field,
											mode: "discreet",
											colorMap: { "Unsupported field": DEFAULT_COLOR }
										});
									}
								}}
								className="select select-xs select-primary select-ghost text-sm mr-3"
							>
								<option disabled={true} value="">
									Select field
								</option>
								{legendOptions.map((opt) => (
									<option key={opt}>{opt}</option>
								))}
							</select>
						</>
					)}
					{legendInfo && legendInfo.mode === "gradient" ? (
						<div className="dropdown dropdown-top dropdown-end">
							<div tabIndex={0} role="button">
								<svg
									height="20px"
									width="20px"
									version="1.1"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 32 32"
									className="text-primary cursor-pointer"
									stroke="currentColor"
									fill="currentColor"
								>
									<path
										d="M27.7,3.3c-1.5-1.5-3.9-1.5-5.4,0L17,8.6l-1.3-1.3c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4l1.3,1.3L5,20.6
	c-0.6,0.6-1,1.4-1.1,2.3C3.3,23.4,3,24.2,3,25c0,1.7,1.3,3,3,3c0.8,0,1.6-0.3,2.2-0.9C9,27,9.8,26.6,10.4,26L21,15.4l1.3,1.3
	c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3c0.4-0.4,0.4-1,0-1.4L22.4,14l5.3-5.3C29.2,7.2,29.2,4.8,27.7,3.3z M9,24.6
	c-0.4,0.4-0.8,0.6-1.3,0.5c-0.4,0-0.7,0.2-0.9,0.5C6.7,25.8,6.3,26,6,26c-0.6,0-1-0.4-1-1c0-0.3,0.2-0.7,0.5-0.8
	c0.3-0.2,0.5-0.5,0.5-0.9c0-0.5,0.2-1,0.5-1.3L17,11.4l2.6,2.6L9,24.6z"
									/>
								</svg>
							</div>
							<ul
								tabIndex={-1}
								className="dropdown-content menu bg-base-200 rounded-box z-1 w-52 shadow-sm p-2 flex-nowrap"
							>
								<div className="flex gap-2 items-center pb-2">
									<ResetButton
										disabled={legendInfo.palette === DEFAULT_PALETTE}
										dataTip={"Reset to " + DEFAULT_PALETTE}
										resetFunction={() => {
											setLegendInfo({ ...legendInfo, palette: DEFAULT_PALETTE });
											(document.activeElement as HTMLDivElement).blur();
										}}
									/>
									<input
										type="text"
										onChange={(e) => setFilter(e.target.value)}
										value={filter}
										placeholder={`Filter colors`}
										className="input input-primary input-sm w-full flex-1 min-w-0 text-primary py-1"
									/>
								</div>

								<div className="max-h-75 !overflow-y-scroll overscroll-contain flex flex-col gap-2">
									{Object.keys(chroma.brewer)
										.sort()
										.reduce((acc, scaleName) => {
											if (scaleName.toLowerCase().includes(filter.toLowerCase()) && scaleName !== legendInfo.palette) {
												const scale = chroma.brewer[scaleName as keyof typeof chroma.brewer];
												acc.push(
													<li key={scaleName} className="w-full">
														<a
															className="!w-auto !bg-base-200 !flex items-center justify-center !rounded-md !p-1 font-semibold"
															style={{
																backgroundImage: `linear-gradient(to right, ${scale.join(",")})`
															}}
															onClick={() => {
																setLegendInfo({ ...legendInfo, palette: scaleName });
																(document.activeElement as HTMLDivElement).blur();
															}}
														>
															{scaleName}
														</a>
													</li>
												);
											}

											return acc;
										}, [] as ReactNode[])}
								</div>
							</ul>
						</div>
					) : (
						<></>
					)}
				</div>

				{legendInfo ? (
					<div className="flex flex-col ml-1 mr-2 border-t-2 border-primary mt-2 pt-3 pb-2 max-h-25 overflow-y-auto overflow-x-hidden">
						{legendInfo.mode === "discreet" ? (
							Object.keys(legendInfo.colorMap).length === 0 ? (
								<div className="flex gap-2 items-center">
									<div className="aspect-square w-[1em] h-[1em]" style={{ backgroundColor: DEFAULT_COLOR.hex() }}></div>
									<div className="text-xs">No values</div>
								</div>
							) : Object.keys(legendInfo.colorMap).length === 1 ? (
								<div className="flex gap-2 items-center">
									<div
										className="aspect-square w-[1em] h-[1em]"
										style={{ backgroundColor: Object.values(legendInfo.colorMap)[0].hex() }}
									></div>
									<div className="text-xs">{Object.keys(legendInfo.colorMap)[0]}</div>
								</div>
							) : (
								Object.entries(legendInfo.colorMap).map(([key, color]) => (
									<div key={key} className="flex gap-2 items-center ">
										<div
											className="aspect-square w-[1em] h-[1em] select-none cursor-pointer tooltip tooltip-left tooltip-secondary before:text-primary-content"
											data-tip={legendInfo.hidden?.includes(key) ? "Show" : "Hide"}
											style={{ backgroundColor: color.hex() }}
											onClick={(e) => {
												if (legendInfo.hidden?.includes(key)) {
													setLegendInfo({ ...legendInfo, hidden: legendInfo.hidden?.filter((e) => e !== key) });
													e.currentTarget.style.background = "";
													e.currentTarget.style.backgroundColor = color.hex();
												} else {
													setLegendInfo({ ...legendInfo, hidden: [...(legendInfo.hidden || []), key] });
													e.currentTarget.style.background = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' preserveAspectRatio='none' viewBox='0 0 10 10'><path d='M 10 0 L 0 10' fill='none' stroke='black' stroke-width='1' /></svg>")`;
													e.currentTarget.style.backgroundColor = color.alpha(0.5).hex();
												}
											}}
										></div>
										{titleTable || Object.values(TableMetadata).find((meta) => meta.titleField === legendInfo.field) ? (
											<Link
												href={`/explore/${
													titleTable ||
													Object.keys(TableMetadata).find(
														(table) => TableMetadata[table as Prisma.ModelName].titleField === legendInfo.field
													)
												}/${encodeURIComponent(key)}`}
												className={`!w-auto !h-auto !bg-transparent !cursor-pointer !link-primary !link-hover !text-xs ${
													legendInfo.hidden?.includes(key) ? "line-through text-base-content/50" : ""
												}`}
											>
												{key}
											</Link>
										) : (
											<div
												className={`text-xs ${
													legendInfo.hidden?.includes(key) ? "line-through text-base-content/50" : ""
												}`}
											>
												{key}
											</div>
										)}
									</div>
								))
							)
						) : legendInfo.mode === "gradient" ? (
							<div>
								<div
									className="w-full flex items-center justify-center rounded-md p-2 tooltip tooltip-secondary before:text-primary-content"
									// data-tip={legendInfo.palette}
									style={{
										backgroundImage: `linear-gradient(to right, ${chroma.brewer[
											legendInfo.palette as keyof typeof chroma.brewer
										].join(",")})`
									}}
								/>
								<div className="flex justify-between">
									{typeof legendInfo.range[0] === "number" ? (
										<>
											<span>{Math.round(legendInfo.range[0] * 1000) / 1000}</span>
											<span>
												{Math.round(((legendInfo.range[0] + (legendInfo.range[1] as number)) / 2) * 1000) / 1000}
											</span>
											<span>{Math.round((legendInfo.range[1] as number) * 1000) / 1000}</span>
										</>
									) : (
										//TODO: display dates differently depending on distance between dates
										//EG: when dates are at least 2 days apart, displaying them as MM/DD/YYYY is fine
										//when dates are all on the same day, time must be displayed as well
										<>
											<span>{legendInfo.range[0].toLocaleDateString()}</span>
											<span>
												{new Date(
													(legendInfo.range[0].getTime() + (legendInfo.range[1] as Date).getTime()) / 2
												).toLocaleDateString()}
											</span>
											<span>{(legendInfo.range[1] as Date).toLocaleDateString()}</span>
										</>
									)}
								</div>
							</div>
						) : (
							<></>
						)}
					</div>
				) : (
					<></>
				)}
			</Collapsible>
		</div>
	);
}

function PointSizeControl({
	pointSize,
	setPointSize,
	pointSizeStep,
	setPointSizeStep
}: {
	pointSize: number | undefined;
	setPointSize: Dispatch<SetStateAction<number | undefined>>;
	pointSizeStep: number | undefined;
	setPointSizeStep: Dispatch<SetStateAction<number | undefined>>;
}) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			DomEvent.disableClickPropagation(ref.current);
		}
	}, []);

	return (
		<div className="leaflet-control leaflet-bar !border-none" ref={ref}>
			<Collapsible
				dir="left"
				defaultCollapse
				className="w-35 pl-2 pr-1 pt-1 pb-2 gap-1"
				hiddenText="Show Point Size Control"
			>
				<div className="flex justify-between">
					<div className="flex items-center gap-1 mt-1">
						<ResetButton
							disabled={pointSize === DEFAULT_POINT_SIZE}
							dataTip={"Reset to " + DEFAULT_POINT_SIZE}
							resetFunction={() => setPointSize(DEFAULT_POINT_SIZE)}
							dir="tooltip-right"
						/>
						<span className="text-sm">Point Size</span>
					</div>
					<InfoButton
						infoText="The size, in pixels, that the smallest points will be. Every power of 10 increases point size by the step."
						dir="tooltip-right"
						className="self-start"
					/>
				</div>
				<div className="pr-2">
					<input
						type="number"
						className="input input-primary"
						value={pointSize === undefined ? "" : pointSize}
						onChange={(e) => {
							const parsed = parseInt(e.currentTarget.value);
							if (isNaN(parsed)) {
								setPointSize(undefined);
							} else {
								setPointSize(parsed);
							}
						}}
					/>
				</div>

				<div className="flex items-center gap-1">
					<ResetButton
						disabled={pointSizeStep === DEFAULT_POINT_SIZE_STEP}
						dataTip={"Reset to " + DEFAULT_POINT_SIZE_STEP}
						resetFunction={() => setPointSizeStep(DEFAULT_POINT_SIZE_STEP)}
						dir="tooltip-right"
					/>
					<span className="text-sm">Step</span>
				</div>
				<div className="pr-2">
					<input
						type="number"
						className="input input-primary"
						value={pointSizeStep === undefined ? "" : pointSizeStep}
						onChange={(e) => {
							const parsed = parseInt(e.currentTarget.value);
							if (isNaN(parsed)) {
								setPointSizeStep(undefined);
							} else {
								setPointSizeStep(parsed);
							}
						}}
					/>
				</div>
			</Collapsible>
		</div>
	);
}

function ClusterControl({
	cluster,
	value,
	onChange,
	clusterRadius
}: {
	cluster: boolean;
	value: number | undefined;
	onChange: Dispatch<SetStateAction<number | undefined>>;
	clusterRadius?: number;
}) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			DomEvent.disableClickPropagation(ref.current);
		}
	}, []);

	if (!cluster) {
		return null;
	}

	return (
		<div className="leaflet-control leaflet-bar !border-none" ref={ref}>
			<Collapsible dir="left" defaultCollapse className="w-35 pl-2 pr-1 pt-1 pb-2" hiddenText="Show Cluster Control">
				<div className="flex justify-between">
					<div className="flex items-center gap-1 mt-1">
						<ResetButton
							disabled={clusterRadius ? value === clusterRadius : value === DEFAULT_CLUSTER_RADIUS}
							dataTip={`Reset to ${clusterRadius || DEFAULT_CLUSTER_RADIUS}`}
							resetFunction={() => onChange(clusterRadius || DEFAULT_CLUSTER_RADIUS)}
							dir="tooltip-right"
						/>
						<span className="text-sm">Cluster</span>
					</div>
					<InfoButton
						infoText="The distance, in pixels, where points will begin clustering. Set to zero to disable clustering."
						dir="tooltip-right"
						className="self-start"
					/>
				</div>
				<div className="pr-2">
					<input
						type="number"
						className="input input-primary"
						value={value === undefined ? "" : value}
						onChange={(e) => {
							const parsed = parseInt(e.currentTarget.value);
							if (isNaN(parsed)) {
								onChange(undefined);
							} else {
								onChange(parsed);
							}
						}}
					/>
				</div>
			</Collapsible>
		</div>
	);
}

function DrawSelectedControl({
	pointsInside,
	table,
	id,
	legendInfo
}: {
	pointsInside: Location[];
	table: Uncapitalize<Prisma.ModelName>;
	id: string;
	legendInfo: LegendInfo;
}) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			DomEvent.disableClickPropagation(ref.current);
			DomEvent.disableScrollPropagation(ref.current);
		}
	}, []);

	return (
		<div className="leaflet-control" ref={ref}>
			<Collapsible hiddenText={`Show ${TableMetadata[table].plural} selected with shapes`}>
				<div className="px-3 pt-1 text-primary text-lg">Selected With Shapes</div>
				<PopupWithSearchBody
					table={table}
					id={id}
					legendInfo={legendInfo}
					loc={{
						decimalLatitude: NaN,
						decimalLongitude: NaN,
						values: pointsInside
					}}
					className="pt-0"
				/>
			</Collapsible>
		</div>
	);
}

function NoLocationPointsControl({
	noLocationPoints,
	table,
	id,
	legendInfo
}: {
	noLocationPoints: NullLocation[];
	table: Uncapitalize<Prisma.ModelName>;
	id: string;
	legendInfo: LegendInfo;
}) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			DomEvent.disableClickPropagation(ref.current);
			DomEvent.disableScrollPropagation(ref.current);
		}
	}, []);

	return (
		<div className="leaflet-control" ref={ref}>
			<Collapsible dir="left" defaultCollapse hiddenText={`Show ${TableMetadata[table].plural} with no location data`}>
				<div className="px-3 pt-1 text-primary text-lg">No Location Data</div>
				<PopupWithSearchBody
					table={table}
					id={id}
					legendInfo={legendInfo}
					loc={{
						decimalLatitude: NaN,
						decimalLongitude: NaN,
						values: noLocationPoints as Location[] //doesn't matter here
					}}
					className="pt-0"
				/>
			</Collapsible>
		</div>
	);
}

function LoadingControl({ loading }: { loading: boolean }) {
	if (!loading) {
		return null;
	}

	return (
		<div className="leaflet-top leaflet-left w-full h-full">
			<div className="leaflet-control leaflet-bar !border-none w-full h-full !m-0">
				<div className="bg-base-100 w-full h-full opacity-10" />
			</div>
		</div>
	);
}
