"use client";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useState } from "react";
import { DBSCAN } from "density-clustering";
import { Prisma } from "@/app/generated/prisma/client";
import { DeadValueEnum } from "@/types/enums";
import { EXPLORE_ROUTES } from "@/types/objects";

export default function ActualMap({
	locations,
	id,
	title,
	titleTable,
	iconSize = 25,
	table,
	legend,
	cluster = false
}: {
	locations: {
		decimalLatitude: number | null;
		decimalLongitude: number | null;
		color?: string;
		[key: string]: any;
	}[];
	id: string;
	title?: string;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	iconSize?: number;
	table: Uncapitalize<Prisma.ModelName>;
	legend?: Record<string, string>;
	cluster?: boolean;
}) {
	const [zoomLevel, setZoomLevel] = useState(5);

	function ZoomControl() {
		const mapEvents = useMapEvents({
			zoomend: () => {
				setZoomLevel(mapEvents.getZoom());
			}
		});

		return null;
	}

	function LegendControl() {
		if (!legend) {
			return null;
		}

		return (
			<div className="leaflet-bottom leaflet-right leaflet-control leaflet-bar map-legend mr-5 mb-8 !border-none card bg-base-100 card-xs shadow-sm card-body px-3 py-1 block">
				{Object.entries(legend).map(([key, color]) => (
					<div key={key} className="flex gap-2 items-center">
						<div className="aspect-square w-[1em] h-[1em]" style={{ backgroundColor: color }}></div>
						<Link
							href={`/explore/${table}/${encodeURIComponent(key)}`}
							className="!w-auto !h-auto !bg-transparent !text-primary hover:underline"
						>
							{key}
						</Link>
					</div>
				))}
			</div>
		);
	}

	//remove points where a lat or long is null
	let points = locations.filter((loc) => loc.decimalLatitude !== null && loc.decimalLongitude !== null) as {
		decimalLatitude: number;
		decimalLongitude: number;
		[key: string]: any;
	}[];

	if (cluster) {
		//cluster location data
		const dataset = points.reduce((acc, loc) => {
			acc.push([loc.decimalLatitude, loc.decimalLongitude]);

			return acc;
		}, [] as [number, number][]);
		const dbscan = new DBSCAN();
		//adjust second argument to adjust when points cluster
		const clusters = dbscan.run(dataset, 50 / zoomLevel ** 2.5, 2);
		//take index of cluster and average latlongs
		const clusteredLocations = [];
		for (const c of clusters) {
			const sum = [0, 0];
			const values = [];
			for (const i of c) {
				if (!(dataset[i][0] in DeadValueEnum || dataset[i][1] in DeadValueEnum)) {
					sum[0] += dataset[i][0];
					sum[1] += dataset[i][1];
					values.push(points[i][id]);
				}
			}
			if (values.length) {
				clusteredLocations.push({ values, decimalLatitude: sum[0] / c.length, decimalLongitude: sum[1] / c.length });
			}
		}
		points = clusteredLocations;
	}

	//calculate average of locations for starting position of map
	let avgLat = {
		sum: 0,
		count: 0
	};
	let avgLng = {
		sum: 0,
		count: 0
	};
	for (let loc of points) {
		if (!(loc.decimalLatitude in DeadValueEnum) && !(loc.decimalLongitude in DeadValueEnum)) {
			avgLat.sum += loc.decimalLatitude;
			avgLat.count++;

			avgLng.sum += loc.decimalLongitude;
			avgLng.count++;
		}
	}
	const centerStart = {
		lat: avgLat.sum / avgLat.count,
		lng: avgLng.sum / avgLng.count
	};

	return (
		<div className="flex flex-col items-start h-full w-full">
			<MapContainer className="w-full h-full grow" center={centerStart} zoom={zoomLevel}>
				<ZoomControl />
				<LegendControl />
				<TileLayer
					attribution='Powered by <a href="https://www.esri.com/en-us/home" target="_blank">Esri</a>'
					url={`https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}?token=${process.env.ARCGIS_KEY}`}
				/>
				{points.map((loc, i) => (
					<Marker
						key={loc.decimalLatitude.toString() + loc.decimalLongitude.toString() + i}
						icon={divIcon({
							className: "bg-none",
							html:
								`<div class='h-full text-center font-mono content-center rounded-full border border-black text-white' style=background-color:${
									loc.color ? loc.color : "rgb(200,0,0)"
								}>` +
								(cluster ? loc.values.length.toString() : "") +
								"</div>",
							iconSize: [iconSize, iconSize]
						})}
						position={{
							lat: loc.decimalLatitude,
							lng: loc.decimalLongitude
						}}
					>
						<Popup className="map-popup">
							<div className="font-sans bg-base-100 p-4 rounded-lg">
								{title &&
									loc[title] &&
									(titleTable ? (
										<div className="text-xl border-b-2 border-primary pb-2 mb-2">
											<Link href={`/explore/${titleTable}/${loc[title]}`} className="link link-primary link-hover">
												{loc[title]}
											</Link>
										</div>
									) : (
										<h2 className="text-primary text-xl border-b-2 pb-2 mb-2">{loc[title]}</h2>
									))}
								<div className="flex flex-col max-h-20 overflow-y-scroll pr-5">
									{cluster ? (
										<>
											<h2 className="text-primary text-lg">{EXPLORE_ROUTES[table as keyof typeof EXPLORE_ROUTES]}</h2>
											{loc.values.map((label: string) => (
												<Link
													key={label}
													href={`/explore/${table}/${encodeURIComponent(label)}`}
													className="link link-primary link-hover"
												>
													{label}
												</Link>
											))}
										</>
									) : (
										<>
											<h2 className="text-primary text-lg">{table.slice(0, 1).toUpperCase() + table.slice(1)}</h2>

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
