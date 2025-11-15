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
import { Location, LocationWithoutValues } from "@/types/globals";
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

type Bounds = [[number, number], [number, number]];

type NullLocation = {
	decimalLatitude: number | null;
	decimalLongitude: number | null;
	[key: string]: any;
};

type LegendInfo =
	| ({ field: string | string[] } & (
			| { mode: "discreet"; colorMap: Record<string, Color> }
			| { mode: "gradient"; range: [number, number]; palette: string }
	  ))
	| undefined;

const DEFAULT_COLOR = chroma("red");
const DEFAULT_PALETTE = "YlGnBu";
const DEFAULT_POINT_SIZE = 20;
const DEFAULT_POINT_SIZE_STEP = 10;
const DEFAULT_CLUSTER_RADIUS = 50;

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
	loc: Location | LocationWithoutValues,
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

function getLegendColor(legend: LegendInfo, loc: Location | LocationWithoutValues) {
	if (legend) {
		if (legend.mode === "discreet") {
			return legend.colorMap[getTitleIdValue(legend.field, loc)];
		} else if (legend.mode === "gradient") {
			const percent = ((loc[legend.field as string] as number) - legend.range[0]) / (legend.range[1] - legend.range[0]);
			return chroma.scale(legend.palette)(percent);
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

function getConicGradient(colors: chroma.Color[]) {
	return `conic-gradient(from ${360 / colors.length}deg,${colors
		.map((c, i) => `${c.hex()} 0% ${(100 / colors.length) * (i + 1)}%`)
		.join(",")});`;
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
	let filteredLocations = [] as Location[];
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

					if (titleTable) {
						defaultOptions.add(getTitleIdValue(TableMetadata[titleTable].titleField, loc));
					}

					filteredLocations.push({ ...loc });
				}
			}
		}

		mapProps = { bounds };
	}

	let defaultLegend = undefined as LegendInfo;
	let points;
	if (titleTable) {
		const titleId = TableMetadata[titleTable].titleField;

		//assign color to each option
		const optionsArray = Array.from(defaultOptions);
		const colors = distinctColors({ count: optionsArray.length });
		const colorMap = {} as Record<string, Color>;
		for (let i = 0; i < optionsArray.length; i++) {
			colorMap[optionsArray[i]] = colors[i];
		}
		defaultLegend = { field: titleId, mode: "discreet", colorMap };

		//assemble locations object with assigned color and list of locations
		points = {} as Record<string, Location[]>;
		for (const loc of filteredLocations) {
			const opt = getTitleIdValue(titleId, loc);
			if (points[opt]) {
				points[opt].push(loc);
			} else {
				points[opt] = [loc];
			}
		}
	} else {
		points = filteredLocations;
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
						ne: { lat: number; lng: number };
						sw: { lat: number; lng: number };
					};
					points: { lat: number; lng: number }[];
			  }
			| {
					type: "circle";
					center: { lat: number; lng: number };
					radius: number;
			  }
		>
	);

	function checkShapes(pts = filteredLocations) {
		let tempPoints = [...pts];

		if (Object.keys(shapes).length) {
			//dim color of points outside of drawn shapes
			const tempPointsInside = [] as typeof pts;

			for (let i = 0; i < tempPoints.length; i++) {
				let inside = false;
				for (const [k, s] of Object.entries(shapes)) {
					if (s.type === "polygon") {
						//check if point is inside bounding box
						if (
							tempPoints[i].decimalLatitude < s.bounds.ne.lat &&
							tempPoints[i].decimalLatitude > s.bounds.sw.lat &&
							tempPoints[i].decimalLongitude < s.bounds.ne.lng &&
							tempPoints[i].decimalLongitude > s.bounds.sw.lng
						) {
							tempPointsInside.push(tempPoints[i]);
							inside = true;
							break;
						} else {
							//TODO: raycast to check if inside polygon (https://stackoverflow.com/questions/217578/how-can-i-determine-whether-a-2d-point-is-within-a-polygon)
						}
					} else if (s.type === "circle") {
						//check if point inside of circle
						const distance = measure(
							s.center.lat,
							s.center.lng,
							tempPoints[i].decimalLatitude,
							tempPoints[i].decimalLongitude
						);
						if (distance <= s.radius) {
							tempPointsInside.push(tempPoints[i]);
							inside = true;
							break;
						}
					}
				}

				//TODO: visually show that shapes are inside/outside the shapes
				if (inside || !Object.keys(shapes).length) {
					// tempPoints[i].color = changeAlpha(tempPoints[i].color!, "1");
				} else {
					// tempPoints[i].color = changeAlpha(tempPoints[i].color!, "0");
				}
			}

			setPointsInside(tempPointsInside);
		}
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
					const uniqueColors = new Set() as Set<string>;
					const colorsArray = [] as string[];
					for (const marker of cluster.getAllChildMarkers()) {
						count++;

						if (marker.options.children.props.loc.values) {
							childrenWithValues++;
							valuesCount += marker.options.children.props.loc.values.length;

							for (const val of marker.options.children.props.loc.values) {
								const color = getLegendColor(legendInfo, val);
								const c = color ? color.hex() : DEFAULT_COLOR.hex();
								uniqueColors.add(c);
								colorsArray.push(c);
							}
						} else {
							const color = getLegendColor(legendInfo, marker.options.children.props.loc);
							const c = color ? color.hex() : DEFAULT_COLOR.hex();
							uniqueColors.add(c);
							colorsArray.push(c);
						}
					}

					const color = chroma.average(colorsArray);

					const combined = childrenWithValues ? count - childrenWithValues + valuesCount : count;

					let size =
						(pointSize || DEFAULT_POINT_SIZE) +
						(pointSizeStep || DEFAULT_POINT_SIZE_STEP) * (Math.floor(combined).toString().length - 1);

					const sharedStyles = "h-full w-full rounded-full";
					const borderStyles = "border border-black";
					const tooltipStyles = "tooltip tooltip-secondary before:text-primary-content";

					let html;
					if (count === 1 && !valuesCount) {
						count;
						html = `<div class='${sharedStyles} ${borderStyles}' style=background-color:${color.hex()};></div>`;
					} else {
						if (legendInfo?.mode === "discreet" && uniqueColors.size > 1) {
							const orderedColors = Object.values(legendInfo.colorMap).filter((color) => uniqueColors.has(color.hex()));
							//move first color to end because conic gradient doesn't start at 12 o'clock
							orderedColors.push(orderedColors.shift() as chroma.Color);

							if (count === 1) {
								html = `<div class='${sharedStyles} ${borderStyles} ${tooltipStyles}' data-tip='${valuesCount}' style='background:${getConicGradient(
									orderedColors
								)}'></div>`;
							} else {
								html =
									`<div class='p-1 ${sharedStyles} ${tooltipStyles}' data-tip='${combined}' style='background:${getConicGradient(
										orderedColors.map((color) => color.mix("white", 0.4, "oklab"))
									)}'>` +
									`<div class='${sharedStyles}' style='background:${getConicGradient(orderedColors)}'></div>` +
									`</div>`;
							}
						} else {
							if (count === 1) {
								html = `<div class='${sharedStyles} ${borderStyles} ${tooltipStyles}' data-tip='${valuesCount}' style=background-color:${color.hex()};></div>`;
							} else {
								html = `<div class='border-4 border-white/40 ${sharedStyles} ${tooltipStyles}' data-tip='${combined}' style=background-color:${color.hex()};></div>`;
							}
						}
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
		? { titleTable, points: points as Record<string, Location[]> }
		: { titleTable: undefined, points: points as Location[] };

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
						setLegend={setLegendInfo}
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

				{Array.isArray(points) ? (
					<ClusterGroup radius={cluster ? clusterRadiusValue : 0}>
						{points.map((loc, i) => (
							<Marker key={i} position={{ lat: loc.decimalLatitude, lng: loc.decimalLongitude }}>
								<PopupWithSearch table={table} titleTable={titleTable} loc={loc} id={id} legendInfo={legendInfo} />
							</Marker>
						))}
					</ClusterGroup>
				) : (
					<>
						{Object.values(points).map((locArray, i) => (
							<ClusterGroup key={i} radius={cluster ? clusterRadiusValue : 0}>
								{locArray.map((loc, j) => (
									<Marker
										key={i.toString() + j.toString()}
										position={{
											lat: loc.decimalLatitude,
											lng: loc.decimalLongitude
										}}
									>
										<PopupWithSearch table={table} titleTable={titleTable} loc={loc} id={id} legendInfo={legendInfo} />
									</Marker>
								))}
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

function PopupWithSearch({
	table,
	titleTable,
	loc,
	id,
	legendInfo
}: {
	table: Uncapitalize<Prisma.ModelName>;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	loc: Location;
	id: string;
	legendInfo: LegendInfo;
}) {
	const [filter, setFilter] = useState("");

	return (
		<Popup className="map-popup">
			<div className="font-sans bg-base-100 points[i]-4 rounded-lg p-3 pt-5 overscroll-contain">
				{titleTable && (
					<Link
						href={`/explore/${titleTable}/${
							typeof TableMetadata[titleTable].titleField === "string"
								? loc[TableMetadata[titleTable].titleField]
								: TableMetadata[titleTable].titleField.map((f) => loc[f]).join("/")
						}`}
						className="link link-primary link-hover text-xl"
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
								{TableMetadata[table].plural} ({loc.values.length})
							</h2>
							<div className="flex flex-col max-h-20 overflow-y-scroll pr-5">
								{loc.values.reduce((acc: ReactNode[], l: LocationWithoutValues) => {
									if (l[id].toLowerCase().includes(filter.toLowerCase())) {
										if (legendInfo) {
											const color = getLegendColor(legendInfo, l);
											acc.push(
												<div key={l[id]} className="flex gap-2 items-center">
													<div
														className="aspect-square w-[1em] h-[1em]"
														style={{ backgroundColor: color ? color.hex() : DEFAULT_COLOR.hex() }}
													></div>
													<Link
														href={`/explore/${table}/${encodeURIComponent(l[id])}`}
														className="link link-primary link-hover"
													>
														{l[id]}
													</Link>
												</div>
											);
										} else {
											acc.push(
												<Link
													key={l[id]}
													href={`/explore/${table}/${encodeURIComponent(l[id])}`}
													className="link link-primary link-hover"
												>
													{l[id]}
												</Link>
											);
										}
									}

									return acc;
								}, [])}
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
										className="link link-primary link-hover"
									>
										{loc[id]}
									</Link>
								</div>
							) : (
								<Link
									href={`/explore/${table}/${encodeURIComponent(loc[id])}`}
									className="link link-primary link-hover"
								>
									{loc[id]}
								</Link>
							)}
						</>
					)}
				</>
			</div>
		</Popup>
	);
}

function Collapsible({
	children,
	dir = "right",
	className = ""
}: {
	children: ReactNode;
	dir?: "right" | "left" | "up" | "down";
	className?: string;
}) {
	const [collapse, setCollapse] = useState(false);

	const panel = (
		<div
			className={`card card-xs card-body justify-center min-h-[45px] min-w-[45px] [:where(&)]:bg-base-100 [:where(&)]:shadow-sm [:where(&)]:p-2 ${className} ${
				collapse ? "hidden" : ""
			}`}
		>
			{children}
		</div>
	);

	let rotationOpen;
	let rotationClosed;
	let flexDir;
	let collapsePos;
	let openRounded;

	if (dir === "right") {
		rotationOpen = "";
		rotationClosed = "rotate-180";
		flexDir = "flex-row";
		collapsePos = "self-end";
		openRounded = "rounded-r-none pr-1";
	} else if (dir === "left") {
		rotationOpen = "rotate-180";
		rotationClosed = "";
		flexDir = "flex-row";
		collapsePos = "self-start";
		openRounded = "rounded-l-none pl-1";
	} else if (dir === "up") {
		rotationOpen = "-rotate-90";
		rotationClosed = "rotate-90";
		flexDir = "flex-col";
		collapsePos = "self-start";
		openRounded = "rounded-t-none pt-1";
	} else if (dir === "down") {
		rotationOpen = "rotate-90";
		rotationClosed = "-rotate-90";
		flexDir = "flex-col";
		collapsePos = "self-end";
		openRounded = "rounded-b-none pb-1";
	}

	return (
		<div className={`flex ${flexDir} ${collapse ? collapsePos : ""}`}>
			{dir === "left" || dir === "up" ? panel : <></>}
			<div
				className={`card bg-base-100 card-xs shadow-sm card-body p-2 self-center justify-center cursor-pointer ${
					collapse ? "" : openRounded
				}`}
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
	dir = "top"
}: {
	disabled: boolean;
	dataTip: string;
	resetFunction: () => void;
	dir?: "top" | "bottom" | "left" | "right";
}) {
	let tooltipDir;
	if (dir === "top") {
		tooltipDir = "tooltip-top";
	} else if (dir === "bottom") {
		tooltipDir = "tooltip-bottom";
	} else if (dir === "left") {
		tooltipDir = "tooltip-left";
	} else if (dir === "right") {
		tooltipDir = "tooltip-right";
	}

	return (
		<div
			className={`tooltip tooltip-secondary before:text-primary-content ${tooltipDir}`}
			data-tip={disabled ? "" : dataTip}
		>
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
	setLegend,
	setLoading,
	legendOptions,
	points,
	table,
	titleTable
}: {
	legend: boolean;
	legendInfo: LegendInfo;
	setLegend: Dispatch<SetStateAction<LegendInfo>>;
	setLoading: Dispatch<SetStateAction<boolean>>;
	legendOptions: string[];
	table: Uncapitalize<Prisma.ModelName>;
} & (
	| { titleTable: Uncapitalize<Prisma.ModelName>; points: Record<string, Location[]> }
	| { titleTable?: undefined; points: Location[] }
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
			<Collapsible>
				<div className="text-lg flex justify-between items-center gap-2">
					{titleTable ? (
						// TODO: enable changing legend even with titleTable, keep clustering linked to titleTable
						<span className="pl-2">{TableMetadata[titleTable].plural}</span>
					) : (
						<>
							<ResetButton
								disabled={!!legendInfo?.field}
								dataTip="Reset Legend"
								resetFunction={() => setLegend(undefined)}
							/>

							<select
								value={legendInfo ? legendInfo.field : ""}
								onChange={async (e) => {
									const field = e.target.value;

									//give control back to browser to display loading
									setLoading(true);
									await new Promise((resolve) => setTimeout(resolve, 1));

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

									const shape = TableMetadata[table].schema.shape;
									const type = getZodType(shape[field as keyof typeof shape]).type;

									if (type === "string") {
										//check if invalid number of options
										if (optionsArray.length === 0 || (optionsArray.length === 1 && optionsArray[0] == null)) {
											setLegend({ field, mode: "discreet", colorMap: {} });
											return;
										} else if (optionsArray.length === 1) {
											setLegend({ field, mode: "discreet", colorMap: { [optionsArray[0]]: DEFAULT_COLOR } });
											return;
										} else {
											//valid
											const colors = distinctColors({ count: optionsArray.length });
											const colorMap = {} as Record<string, Color>;
											for (let i = 0; i < optionsArray.length; i++) {
												colorMap[optionsArray[i]] = colors[i];
											}

											setLegend({ field, mode: "discreet", colorMap });
										}
									} else if (type === "integer" || type === "float") {
										let parser;
										if (type === "integer") {
											parser = parseInt;
										} else {
											parser = parseFloat;
										}

										//parse all values as number and ignore NaN/DeadValues
										const parsedOptions = optionsArray.reduce((acc, opt) => {
											const parsed = parser(opt);
											if (!isNaN(parsed) && !DeadValueNumbers.includes(parsed)) {
												acc.push(parsed);
											}

											return acc;
										}, [] as number[]);

										//check if invalid number of options
										if (parsedOptions.length === 0 || (parsedOptions.length === 1 && parsedOptions[0] == null)) {
											setLegend({ field, mode: "discreet", colorMap: {} });
										} else if (parsedOptions.length === 1) {
											setLegend({ field, mode: "discreet", colorMap: { [parsedOptions[0]]: DEFAULT_COLOR } });
										} else {
											//valid
											setLegend({
												field,
												mode: "gradient",
												range: [parsedOptions[0], parsedOptions[parsedOptions.length - 1]],
												palette: legendInfo?.mode === "gradient" ? legendInfo.palette : DEFAULT_PALETTE
											});
										}
									} else {
										//TODO: add support for more field types
									}
								}}
								className="select select-xs select-primary select-ghost text-sm"
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
											setLegend({ ...legendInfo, palette: DEFAULT_PALETTE });
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
															className="!w-full !bg-base-200 !flex items-center justify-center !rounded-md !p-1 font-semibold"
															style={{
																backgroundImage: `linear-gradient(to right, ${scale.join(",")})`
															}}
															onClick={() => {
																setLegend({ ...legendInfo, palette: scaleName });
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
					<div className="flex flex-col ml-1 mr-2 border-t-2 border-primary mt-2 pt-3 pb-2 max-h-50 overflow-y-scroll">
						{legendInfo.mode === "discreet" ? (
							Object.keys(legendInfo.colorMap).length === 0 ? (
								<div className="flex gap-2 items-center">
									<div className="aspect-square w-[1em] h-[1em]" style={{ backgroundColor: DEFAULT_COLOR.hex() }}></div>
									<div className="text-xs">No values</div>
								</div>
							) : (
								Object.entries(legendInfo.colorMap).map(([key, color]) => (
									<div key={key} className="flex gap-2 items-center">
										{/* TODO: allow clicking on box to enable/disable visibility */}
										<div className="aspect-square w-[1em] h-[1em]" style={{ backgroundColor: color.hex() }}></div>
										{titleTable || Object.values(TableMetadata).find((meta) => meta.titleField === legendInfo.field) ? (
											<Link
												href={`/explore/${
													titleTable ||
													Object.keys(TableMetadata).find(
														(table) => TableMetadata[table as Prisma.ModelName].titleField === legendInfo.field
													)
												}/${encodeURIComponent(key)}`}
												className="!w-auto !h-auto !bg-transparent !link !link-primary !link-hover !text-xs"
											>
												{key}
											</Link>
										) : (
											<div className="text-xs">{key}</div>
										)}
									</div>
								))
							)
						) : legendInfo.mode === "gradient" ? (
							<div>
								<div
									className="w-full flex items-center justify-center rounded-md p-2"
									style={{
										backgroundImage: `linear-gradient(to right, ${chroma.brewer[
											legendInfo.palette as keyof typeof chroma.brewer
										].join(",")})`
									}}
								/>
								<div className="flex justify-between">
									<span>{Math.round(legendInfo.range[0] * 1000) / 1000}</span>
									<span>{Math.round(((legendInfo.range[0] + legendInfo.range[1]) / 2) * 1000) / 1000}</span>
									<span>{Math.round(legendInfo.range[1] * 1000) / 1000}</span>
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
			<Collapsible dir="left" className="w-35 pl-2 pr-1 pt-1 pb-2 gap-1">
				<div className="flex justify-between">
					<div className="flex items-center gap-1 mt-1">
						<ResetButton
							disabled={pointSize === DEFAULT_POINT_SIZE}
							dataTip={"Reset to " + DEFAULT_POINT_SIZE}
							resetFunction={() => setPointSize(DEFAULT_POINT_SIZE)}
							dir="right"
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
						dir="right"
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
			<Collapsible dir="left" className="w-35 pl-2 pr-1 pt-1 pb-2">
				<div className="flex justify-between">
					<div className="flex items-center gap-1 mt-1">
						<ResetButton
							disabled={clusterRadius ? value === clusterRadius : value === DEFAULT_CLUSTER_RADIUS}
							dataTip={`Reset to ${clusterRadius || DEFAULT_CLUSTER_RADIUS}`}
							resetFunction={() => onChange(clusterRadius || DEFAULT_CLUSTER_RADIUS)}
							dir="right"
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
