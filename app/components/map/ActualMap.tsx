"use client";

import { MapContainer, TileLayer, Marker, Popup, FeatureGroup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { divIcon, DomEvent, LatLngBoundsExpression, FeatureGroup as LFeatureGroup } from "leaflet";
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
import { capitalizeTable, randomColors } from "@/app/helpers/utils";
import { MapProps, Location, LocationWithoutValues } from "@/types/globals";
import InfoButton from "../InfoButton";

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

function getTitleIdValue(titleId: (typeof TableMetadata)[keyof typeof TableMetadata]["titleField"], loc: Location) {
	if (typeof titleId === "string") {
		return loc[titleId];
	} else {
		let joined = "";
		for (let i = 0; i < titleId.length; i++) {
			if (i) {
				joined += "/";
			}
			joined += loc[titleId[i]];
		}
		return joined;
	}
}

export default function ActualMap({
	locations,
	mapProps,
	id = "samp_name",
	table = "sample",
	titleTable,
	cluster = false,
	clusterRadius = 50,
	draw = false
}: {
	locations: Location[];
	mapProps: MapProps;
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

	let locationPoints;
	if (titleTable) {
		const titleId = TableMetadata[titleTable].titleField;
		//get all options for coloring
		const options = new Set() as Set<string>;
		for (const loc of locations) {
			options.add(getTitleIdValue(titleId, loc));
		}

		//assign color to each option
		const optionsArray = Array.from(options);
		const colors = randomColors(optionsArray.length);
		const optionsToColors = {} as Record<string, string>;
		for (let i = 0; i < optionsArray.length; i++) {
			optionsToColors[optionsArray[i]] = colors[i];
		}

		//assemble locations object with assigned color and list of locations
		locationPoints = {} as Record<string, { color: string; locs: Location[] }>;
		for (const loc of locations) {
			const opt = getTitleIdValue(titleId, loc);
			if (locationPoints[opt]) {
				locationPoints[opt].locs.push(loc);
			} else {
				locationPoints[opt] = { color: optionsToColors[opt], locs: [loc] };
			}
		}
	} else {
		locationPoints = locations;
	}
	const [points, setPoints] = useState(locationPoints);
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

	function checkShapes(pts = locations) {
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

	function ClusterGroup({
		color = "rgb(200,0,0)",
		radius,
		children
	}: {
		color?: string;
		radius: number | undefined;
		children: ReactNode;
	}) {
		return (
			<MarkerClusterGroup
				maxClusterRadius={radius || 0}
				singleMarkerMode={true}
				chunkedLoading={true}
				iconCreateFunction={(cluster: any) => {
					let count = 0;
					let childrenWithValues = 0;
					let valuesCount = 0;
					for (const marker of cluster.getAllChildMarkers()) {
						count++;

						if (marker.options.children.props.loc.values) {
							childrenWithValues++;
							valuesCount += marker.options.children.props.loc.values.length;
						}
					}

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
				<LegendControl points={points} titleTable={titleTable} />
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
								<PopupWithSearch table={table} titleTable={titleTable} loc={loc} id={id} />
							</Marker>
						))}
					</ClusterGroup>
				) : (
					<>
						{Object.values(points).map((ldata, i) => (
							<ClusterGroup key={i} radius={cluster ? clusterRadiusValue : 0} color={ldata.color}>
								{ldata.locs.map((loc, j) => (
									<Marker
										key={i.toString() + j.toString()}
										position={{
											lat: loc.decimalLatitude,
											lng: loc.decimalLongitude
										}}
									>
										<PopupWithSearch table={table} titleTable={titleTable} loc={loc} id={id} />
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
	id
}: {
	table: Uncapitalize<Prisma.ModelName>;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	loc: Location;
	id: string;
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

									return acc;
								}, [])}
							</div>
						</>
					) : (
						<>
							<h2 className="text-primary text-lg">{capitalizeTable(table)}</h2>
							<Link
								href={`/explore/${table}/${encodeURIComponent(loc[id])}`}
								className="text-info hover:text-info-focus hover:underline transition-colors"
							>
								{loc[id]}
							</Link>
						</>
					)}
				</>
			</div>
		</Popup>
	);
}

function LegendControl({
	points,
	titleTable
}: {
	points:
		| Location[]
		| Record<
				string,
				{
					color: string;
					locs: Location[];
				}
		  >;
	titleTable?: Uncapitalize<Prisma.ModelName>;
}) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			DomEvent.disableClickPropagation(ref.current);
		}
	}, []);

	if (points.length === 0 || !titleTable) {
		return null;
	}

	return (
		<div className="leaflet-bottom leaflet-right" ref={ref}>
			<div className="leaflet-control leaflet-bar !border-none !mb-6">
				<div className="card bg-base-100 card-xs shadow-sm card-body px-3 py-2 block">
					<div className="text-lg border-b-2 border-primary mb-2">{TableMetadata[titleTable].plural}</div>
					{Object.entries(points).map(([key, ldata]) => (
						<div key={key} className="flex gap-2 items-center">
							<div className="aspect-square w-[1em] h-[1em]" style={{ backgroundColor: ldata.color }}></div>
							<Link
								href={`/explore/${titleTable}/${encodeURIComponent(key)}`}
								className="!w-auto !h-auto !bg-transparent !link !link-primary !link-hover !text-sm"
							>
								{key}
							</Link>
						</div>
					))}
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
