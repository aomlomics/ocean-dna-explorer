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
import { DeadValueEnum } from "@/types/enums";

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

const DEFAULT_BOUNDS = [
	[-180, -180],
	[180, 180]
] as Bounds;

function changeAlpha(color: string | undefined, alpha: string) {
	if (color) {
		const split = color.split(",");
		if (split.length === 4) {
			split.pop();
		}

		return (color = split.join(",") + "," + alpha + ")");
	} else {
		return "rgb(200,0,0," + alpha + ")";
	}
}

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
	loc: Location,
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

function getLegendColor(legend: LegendInfo, loc: Location) {
	if (legend) {
		if (legend.mode === "discreet") {
			return legend.colorMap[getTitleIdValue(legend.field, loc)];
		} else if (legend.mode === "gradient") {
			//TODO: do gradient with chroma-js (legend.palette)
		}
	} else {
		//TODO: handle if no legend
	}
	return chroma("red");
}

export default function ActualMap({
	locations,
	id = "samp_name",
	table = "sample",
	titleTable,
	cluster = false,
	clusterRadius = 50,
	draw = false
}: {
	locations: NullLocation[];
	id?: string;
	table?: Uncapitalize<Prisma.ModelName>;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	cluster?: boolean;
	clusterRadius?: number;
	draw?: boolean;
}) {
	const [drawAlmostReady, setDrawAlmostReady] = useState(false);
	const [drawReady, setDrawReady] = useState(false);

	const featureGroupRef = useRef<LFeatureGroup>(null);

	//clump locations if they have identical latlng
	let filteredLocations = [] as Location[];
	//calculate starting map view
	let mapProps = {} as MapProps;

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

					filteredLocations.push({ ...loc });
				}
			}
		}

		mapProps = { bounds };
	}

	let defaultLegend = undefined as LegendInfo;
	let defaultPoints;
	if (titleTable) {
		const titleId = TableMetadata[titleTable].titleField;
		//get all options for coloring
		const options = new Set() as Set<string>;
		for (const loc of filteredLocations) {
			options.add(getTitleIdValue(titleId, loc));
		}

		//assign color to each option
		const optionsArray = Array.from(options);
		const colors = distinctColors({ count: optionsArray.length });
		const colorMap = {} as Record<string, Color>;
		for (let i = 0; i < optionsArray.length; i++) {
			colorMap[optionsArray[i]] = colors[i];
		}
		defaultLegend = { field: titleId, mode: "discreet", colorMap };

		//assemble locations object with assigned color and list of locations
		defaultPoints = {} as Record<string, Location[]>;
		for (const loc of filteredLocations) {
			const opt = getTitleIdValue(titleId, loc);
			if (defaultPoints[opt]) {
				defaultPoints[opt].push(loc);
			} else {
				defaultPoints[opt] = [loc];
			}
		}
	} else {
		defaultPoints = filteredLocations;
	}
	const [legend, setLegend] = useState(defaultLegend);
	const [points, setPoints] = useState(defaultPoints);
	const [pointsInside, setPointsInside] = useState([] as Location[]);

	const [clusterRadiusValue, setClusterRadiusValue] = useState(clusterRadius as number | undefined);

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

				if (inside || !Object.keys(shapes).length) {
					// tempPoints[i].color = changeAlpha(tempPoints[i].color!, "1");
				} else {
					// tempPoints[i].color = changeAlpha(tempPoints[i].color!, "0");
				}
			}

			setPointsInside(tempPointsInside);
		}

		setPoints(tempPoints);
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
					for (const marker of cluster.getAllChildMarkers()) {
						count++;
						uniqueColors.add(marker.options.children.props.color.hex());

						if (marker.options.children.props.loc.values) {
							childrenWithValues++;
							valuesCount += marker.options.children.props.loc.values.length;
						}
					}
					const color = chroma.average(Array.from(uniqueColors));

					const combined = childrenWithValues ? count - childrenWithValues + valuesCount : count;

					let size = 10 + 5 * Math.floor(combined).toString().length;

					let html;
					if (count === 1) {
						if (valuesCount) {
							size += 5;
						}
						html = `<div class='h-full w-full text-center font-mono content-center rounded-full text-white border border-black' style=background-color:${color};>${
							valuesCount || ""
						}</div>`;
					} else {
						size += 10;
						html = `<div class='h-full w-full text-center font-mono content-center rounded-full text-white border-4 border-white/40' style=background-color:${color};>${combined}</div>`;
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

	return (
		<div className="flex flex-col items-start h-full w-full z-100 relative" key={Math.random()}>
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
				<LegendControl legend={legend} titleTable={titleTable} />
				<ClusterControl cluster={cluster} value={clusterRadiusValue} onChange={setClusterRadiusValue} />

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
								<PopupWithSearch
									table={table}
									titleTable={titleTable}
									loc={loc}
									id={id}
									color={getLegendColor(legend, loc)}
									legend={legend}
								/>
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
										<PopupWithSearch
											table={table}
											titleTable={titleTable}
											loc={loc}
											id={id}
											color={getLegendColor(legend, loc)}
											legend={legend}
										/>
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
	color,
	legend
}: {
	table: Uncapitalize<Prisma.ModelName>;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	loc: Location;
	id: string;
	color: Color;
	legend: LegendInfo;
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
										if (legend) {
											acc.push(
												<div key={l[id]} className="flex gap-2 items-center">
													<div className="aspect-square w-[1em] h-[1em]" style={{ backgroundColor: color.hex() }}></div>
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
							{legend ? (
								<div className="flex gap-2 items-center">
									<div className="aspect-square w-[1em] h-[1em]" style={{ backgroundColor: color.hex() }}></div>
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

function LegendControl({ legend, titleTable }: { legend: LegendInfo; titleTable?: Uncapitalize<Prisma.ModelName> }) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			DomEvent.disableClickPropagation(ref.current);
		}
	}, []);

	if (!titleTable || !legend) {
		return null;
	}

	return (
		<div className="leaflet-bottom leaflet-right" ref={ref}>
			<div className="leaflet-control leaflet-bar !border-none !mb-6">
				<div className="card bg-base-100 card-xs shadow-sm card-body px-3 py-2 block">
					<div className="text-lg border-b-2 border-primary mb-2">
						{titleTable ? TableMetadata[titleTable].plural : legend.field}
					</div>
					{legend.mode === "discreet" ? (
						Object.entries(legend.colorMap).map(([key, color]) => (
							<div key={key} className="flex gap-2 items-center">
								<div className="aspect-square w-[1em] h-[1em]" style={{ backgroundColor: color.hex() }}></div>
								<Link
									href={`/explore/${titleTable}/${encodeURIComponent(key)}`}
									className="!w-auto !h-auto !bg-transparent !link !link-primary !link-hover !text-sm"
								>
									{key}
								</Link>
							</div>
						))
					) : (
						<></>
					)}
				</div>
			</div>
		</div>
	);
}

function ClusterControl({
	cluster,
	value,
	onChange
}: {
	cluster: boolean;
	value: number | undefined;
	onChange: Dispatch<SetStateAction<number | undefined>>;
}) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			DomEvent.disableClickPropagation(ref.current);
		}
	}, []);

	if (!cluster) {
		return null;
	} else {
		return (
			<div className="leaflet-bottom leaflet-left" ref={ref}>
				<div className="leaflet-control leaflet-bar !border-none">
					<div className="card bg-base-100 card-xs shadow-sm card-body pl-3 pr-1 pt-1 pb-2 w-25 gap-0">
						<div className="flex justify-between">
							<span className="text-sm mt-1">Cluster</span>
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
					</div>
				</div>
			</div>
		);
	}
}
