"use client";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useState } from "react";
import { DBSCAN } from "density-clustering";
import { Prisma } from "@prisma/client";
import { DeadValueEnum } from "@/types/enums";

export default function ActualMap({
	locations,
	id,
	title,
	iconSize = 25,
	table,
	cluster = false
}: {
	locations: Record<string, any>[];
	id: string;
	title?: string;
	iconSize?: number;
	table: Uncapitalize<Prisma.ModelName>;
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

	let points = locations;

	if (cluster) {
		//cluster location data
		const dataset = locations.map((loc) => [loc.decimalLatitude, loc.decimalLongitude]);
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
					values.push(locations[i][id]);
				}
			}
			if (values.length) {
				clusteredLocations.push({ values, decimalLatitude: sum[0] / c.length, decimalLongitude: sum[1] / c.length });
			}
		}
		points = clusteredLocations;
	}

	const centerStart = { lat: 25.7617, lng: -80.8918 };
	const ARCGIS_API_KEY = process.env.ARCGIS_KEY;

	return (
		<div className="flex flex-col items-start h-full w-full">
			<MapContainer className="w-full h-full grow" center={centerStart} zoom={zoomLevel}>
				<ZoomControl />
				<TileLayer
					attribution='Powered by <a href="https://www.esri.com/en-us/home" target="_blank">Esri</a>'
					url={`https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}?token=${ARCGIS_API_KEY}`}
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
								{title && loc[title] && <h2 className="text-primary text-xl">{loc[title]}</h2>}
								<div className="flex flex-col max-h-20 overflow-y-scroll pr-5">
									{cluster ? (
										loc.values.map((label: string) => (
											<Link
												key={label}
												href={`/explore/${table}/${encodeURIComponent(label)}`}
												className="text-info hover:text-info-focus hover:underline transition-colors"
											>
												{label}
											</Link>
										))
									) : (
										<Link
											href={`/explore/${table}/${encodeURIComponent(loc[id])}`}
											className="text-info hover:text-info-focus hover:underline transition-colors"
										>
											{loc[id]}
										</Link>
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
