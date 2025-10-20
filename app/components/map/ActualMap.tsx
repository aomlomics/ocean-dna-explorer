"use client";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents, FeatureGroup } from "react-leaflet";
import { divIcon, LatLng, LatLngBoundsExpression, FeatureGroup as LFeatureGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";
import { DBSCAN } from "density-clustering";
import { Prisma } from "@/app/generated/prisma/client";
import TableMetadata from "@/types/tableMetadata";
import { EditControl } from "react-leaflet-draw-next";
import { capitalizeTable } from "@/app/helpers/utils";

type Location = {
	decimalLatitude: number;
	decimalLongitude: number;
	color?: string;
	values?: string[];
	[key: string]: any;
};

function changeAlpha(color: string | undefined, alpha: string) {
	if (color) {
		const split = color.split(",");
		split.pop();

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

export default function ActualMap({
	locations,
	mapProps,
	id = "samp_name",
	titleTable,
	iconSize = 25,
	table = "sample",
	legend,
	cluster = false,
	draw = false
}: {
	locations: Location[];
	mapProps:
		| {
				center: LatLng;
				zoom: number;
				bounds?: undefined;
		  }
		| {
				bounds: LatLngBoundsExpression;
				center?: undefined;
				zoom?: undefined;
		  };
	id?: string;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	iconSize?: number;
	table?: Uncapitalize<Prisma.ModelName>;
	legend?: Record<string, string>;
	cluster?: boolean;
	draw?: boolean;
}) {
	const [zoomLevel, setZoomLevel] = useState(5);
	const [drawAlmostReady, setDrawAlmostReady] = useState(false);
	const [drawReady, setDrawReady] = useState(false);

	const featureGroupRef = useRef<LFeatureGroup>(null);

	const [points, setPoints] = useState(locations);
	const [pointsInside, setPointsInside] = useState([] as Location[]);

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

	function checkShapes(pts = points) {
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
					tempPoints[i].color = changeAlpha(tempPoints[i].color!, "1");
				} else {
					tempPoints[i].color = changeAlpha(tempPoints[i].color!, "0");
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

	//zoomLevel
	useEffect(() => {
		if (drawReady) {
			let tempLocations = [...locations];
			//TODO: https://www.npmjs.com/package/react-leaflet-markercluster
			// if (cluster) {
			// 	//cluster location data
			// 	const dataset = tempLocations.map((loc) => [loc.decimalLatitude, loc.decimalLongitude]);
			// 	const dbscan = new DBSCAN();
			// 	//adjust second argument to adjust when points cluster
			// 	const clusters = dbscan.run(dataset, 50 / zoomLevel ** 2.5, 2);
			// 	//take index of cluster and average latlongs
			// 	const clusteredLocations = [];
			// 	for (const c of clusters) {
			// 		const sum = [0, 0];
			// 		const values = [] as string[];
			// 		for (const i of c) {
			// 			sum[0] += dataset[i][0];
			// 			sum[1] += dataset[i][1];
			// 			if (tempLocations[i].values) {
			// 				values.push(...tempLocations[i].values);
			// 			} else {
			// 				values.push(tempLocations[i][id]);
			// 			}
			// 		}
			// 		if (values.length) {
			// 			clusteredLocations.push({
			// 				values,
			// 				decimalLatitude: sum[0] / c.length,
			// 				decimalLongitude: sum[1] / c.length
			// 			});
			// 		}
			// 	}
			// 	tempLocations = clusteredLocations;
			// }

			checkShapes(tempLocations);
		}
	}, [zoomLevel]);

	//waiting until the ref is set, for some reason the ref won't work as a dependency, so wait 2 cycles of rendering to render the draw feature group
	useEffect(() => {
		if (!drawAlmostReady) {
			setDrawAlmostReady(true);
		} else if (!drawReady) {
			setDrawReady(true);
		}
	}, [drawAlmostReady]);

	function ZoomControl() {
		const mapEvents = useMapEvents({
			zoomend: () => {
				setZoomLevel(mapEvents.getZoom());
			},
			zoomlevelschange: () => {
				setZoomLevel(mapEvents.getZoom());
			}
		});

		return null;
	}

	function LegendControl() {
		if (points.length === 0 || !legend || !titleTable) {
			return null;
		}

		return (
			<div className="leaflet-bottom leaflet-right">
				<div className="leaflet-control leaflet-bar !border-none !mb-6">
					<div className="card bg-base-100 card-xs shadow-sm card-body px-3 py-2 block">
						<div className="text-lg border-b-2 border-primary mb-2">{TableMetadata[titleTable].plural}</div>
						{Object.entries(legend).map(([key, color]) => (
							<div key={key} className="flex gap-2 items-center">
								<div className="aspect-square w-[1em] h-[1em]" style={{ backgroundColor: color }}></div>
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

	return (
		<div className="flex flex-col items-start h-full w-full z-100 relative">
			<MapContainer
				maxBounds={
					[
						[-180, -180],
						[180, 180]
					] as LatLngBoundsExpression
				}
				className="w-full h-full grow"
				{...mapProps}
			>
				<LegendControl />
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

				<ZoomControl />

				{points.map((loc, i) => (
					<Marker
						key={loc.decimalLatitude.toString() + loc.decimalLongitude.toString() + i}
						icon={divIcon({
							className: "bg-none",
							html:
								`<div class='h-full text-center font-mono content-center rounded-full border border-black text-white' style=background-color:${
									loc.color ? loc.color : "rgb(200,0,0)"
								}>` +
								(cluster && loc.values ? loc.values.length.toString() : "") +
								"</div>",
							iconSize: [iconSize, iconSize]
						})}
						position={{
							lat: loc.decimalLatitude,
							lng: loc.decimalLongitude
						}}
					>
						<PopupWithSearch table={table} titleTable={titleTable} loc={loc} id={id} />
					</Marker>
				))}

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
				<div className="flex flex-col max-h-20 overflow-y-scroll pr-5">
					{loc.values ? (
						<>
							<h2 className="text-primary text-lg">
								{TableMetadata[table].plural} ({loc.values.length})
							</h2>
							{loc.values.reduce((acc: ReactNode[], label: string) => {
								if (label.toLowerCase().includes(filter.toLowerCase())) {
									acc.push(
										<Link
											key={label}
											href={`/explore/${table}/${encodeURIComponent(label)}`}
											className="link link-primary link-hover"
										>
											{label}
										</Link>
									);
								}

								return acc;
							}, [])}
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
				</div>
			</div>
		</Popup>
	);
}
