"use client";

import { MapContainer, TileLayer, Marker, FeatureGroup } from "react-leaflet";
import { FeatureGroup as LFeatureGroup, Map, Polygon as LPolygon, Circle as LCircle } from "leaflet";
import { FullscreenControl } from "react-leaflet-fullscreen";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "react-leaflet-fullscreen/styles.css";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Prisma } from "@/app/generated/prisma/client";
import TableMetadata, { TableMetadataValue } from "@/types/tableMetadata";
import { EditControl } from "react-leaflet-draw-next";
import { circleToString, getLocationsInsideShapes, getShapesFromUrl, polygonToString } from "@/app/helpers/utils";
import { NullLocation, MapShape } from "@/types/globals";
import { GlobalOmit } from "@/types/objects";
import { usePathname, useSearchParams } from "next/navigation";
import LegendControl from "./controls/LegendControl";
import PointSizeControl from "./controls/PointSizeControl";
import ClusterControl from "./controls/ClusterControl";
import DrawSelectedControl from "./controls/DrawSelectControl";
import PopupWithSearch from "./popups/PopupWithSearch";
import { DEFAULT_CLUSTER_RADIUS, DEFAULT_POINT_SIZE, DEFAULT_POINT_SIZE_STEP } from "./utils/mapUtils";
import LoadingControl from "./controls/LoadingControl";
import RecenterControl from "./controls/RecenterControl";
import NoLocationPointsControl from "./controls/NoLocationPointControl";
import ClusterGroup from "./utils/ClusterGroup";
import useMapLocations from "./utils/useMapLocations";

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

//TODO: taxonomy heatmap toggle
export default function ActualMap({
	locations,
	where,
	id = TableMetadata.sample.titleField,
	table = "sample",
	titleTable,
	defaultLegendField,
	cluster = false,
	clusterRadius,
	legend = false,
	draw = false,
	legendOmit = [],
	shapesToUrl,
	disableSearch
}: {
	locations: NullLocation[];
	where?: Record<string, string>;
	id?: TableMetadataValue["titleField"];
	table?: Uncapitalize<Prisma.ModelName>;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	defaultLegendField?: string;
	cluster?: boolean;
	clusterRadius?: number;
	legend?: boolean;
	draw?: boolean;
	legendOmit?: string[];
	shapesToUrl?: true;
	disableSearch?: true;
}) {
	const searchParams = useSearchParams();
	const pathname = usePathname();

	const [drawAlmostReady, setDrawAlmostReady] = useState(false);
	const [drawReady, setDrawReady] = useState(false);

	const mapRef = useRef<Map>(null);
	const featureGroupRef = useRef<LFeatureGroup>(null);

	const {
		userDefinedOptions,
		defaultLegend,
		filteredLocations,
		mapProps,
		defaultMapProps,
		pointsOrGroups,
		noLocationPoints,
		legendOptions,
		reducedPoints
	} = useMapLocations({
		locations,
		omit: [...legendOmit, ...GlobalOmit, "id", "userDefined"],
		table,
		titleTable,
		defaultLegendField
	});

	const [legendInfo, setLegendInfo] = useState(defaultLegend);
	const [loading, setLoading] = useState(false);

	const [pointSize, setPointSize] = useState(DEFAULT_POINT_SIZE as number | undefined);
	const [pointSizeStep, setPointSizeStep] = useState(DEFAULT_POINT_SIZE_STEP as number | undefined);
	const [clusterRadiusValue, setClusterRadiusValue] = useState(
		(clusterRadius || DEFAULT_CLUSTER_RADIUS) as number | undefined
	);

	const [shapes, setShapes] = useState({} as Record<string, MapShape>);
	const pointsInside = useMemo(() => {
		if (Object.keys(shapes).length) {
			return getLocationsInsideShapes(
				//exclude locations hidden by legend
				filteredLocations.filter(
					(l) =>
						!(
							legendInfo &&
							legendInfo.mode === "discreet" &&
							legendInfo.hidden?.includes(l[legendInfo.field as string])
						)
				),
				Object.values(shapes)
			);
		} else {
			return [];
		}
	}, [shapes, legendInfo, filteredLocations]);

	//shapes
	useEffect(() => {
		if (drawReady) {
			if (shapesToUrl) {
				const newParams = new URLSearchParams(searchParams);
				newParams.delete("polygon");
				newParams.delete("circle");

				for (const s of Object.values(shapes)) {
					if (s.type === "polygon") {
						newParams.append("polygon", polygonToString(s));
					} else if (s.type === "circle") {
						newParams.append("circle", circleToString(s));
					}
				}

				window.history.replaceState(null, "", `${pathname}?${newParams}`);
			}
		}
	}, [shapes]);

	//waiting until the ref is set, for some reason the ref won't work as a dependency, so wait 2 cycles of rendering to render the draw feature group
	useEffect(() => {
		if (!drawAlmostReady) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setDrawAlmostReady(true);
		} else if (!drawReady) {
			if (shapesToUrl) {
				//get shapes from url
				const urlShapes = getShapesFromUrl(searchParams);

				if (urlShapes && featureGroupRef.current) {
					const tempShapes = {} as typeof shapes;
					for (const s of urlShapes) {
						if (s.type === "polygon") {
							featureGroupRef.current.addLayer(new LPolygon(s.points));
						} else if (s.type === "circle") {
							featureGroupRef.current.addLayer(new LCircle(s.center, s.radius));
						}

						for (const id in (featureGroupRef.current as unknown as { _layers: Record<string, any> })._layers) {
							if (!(id in tempShapes)) {
								tempShapes[id] = s;
							}
						}
					}
					setShapes(tempShapes);
				}
			}

			setDrawReady(true);
		}
	}, [drawAlmostReady]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setLoading(false);
	}, [legendInfo]);

	return (
		<div className="flex flex-col items-start h-full w-full z-100 relative">
			<MapContainer
				ref={mapRef}
				preferCanvas={false}
				maxBounds={[
					[-90, -180],
					[90, 180]
				]}
				className="w-full h-full grow"
				{...mapProps}
			>
				<FullscreenControl />

				<div className="leaflet-top leaflet-left pt-25">
					<RecenterControl
						reset={() =>
							defaultMapProps.center
								? mapRef.current?.setView(defaultMapProps.center, defaultMapProps.zoom)
								: mapRef.current?.fitBounds(defaultMapProps.bounds)
						}
					/>
					<NoLocationPointsControl
						noLocationPoints={noLocationPoints}
						table={table}
						id={id}
						legendInfo={legendInfo}
						userDefinedOptions={userDefinedOptions}
						mapRef={mapRef}
						where={where}
						disableSearch={disableSearch}
					/>
				</div>
				<div className="leaflet-top leaflet-right pt-37">
					{pointsInside.length ? (
						<DrawSelectedControl
							pointsInside={pointsInside}
							table={table}
							where={where}
							id={id}
							legendInfo={legendInfo}
							userDefinedOptions={userDefinedOptions}
							mapRef={mapRef}
							shapes={shapes}
							disableSearch={disableSearch}
						/>
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
						userDefinedOptions={userDefinedOptions}
						mapRef={mapRef}
						defaultLegend={defaultLegend}
						table={table}
						titleTable={titleTable}
						reducedPoints={reducedPoints}
					/>
				</div>

				<LoadingControl loading={loading} />

				<TileLayer
					attribution='Powered by <a href="https://www.esri.com/en-us/home" target="_blank">Esri</a>'
					url={`https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}?token=${process.env.ARCGIS_KEY}`}
				/>

				<FeatureGroup ref={featureGroupRef}>
					{draw && drawReady && (
						<EditControl
							position="topright"
							onEdited={(e) => {
								const temp = {} as typeof shapes;
								for (const edit in e.layers._layers) {
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
								for (const del in e.layers._layers) {
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
							// eslint-disable-next-line react-hooks/refs
							featureGroup={featureGroupRef.current!}
						/>
					)}
				</FeatureGroup>

				{Array.isArray(pointsOrGroups) ? (
					//points
					<ClusterGroup
						shapes={shapes}
						pointsInside={pointsInside}
						id={id}
						legendInfo={legendInfo}
						userDefinedOptions={userDefinedOptions}
						pointSize={pointSize}
						pointSizeStep={pointSizeStep}
						radius={clusterRadiusValue ?? 0}
					>
						{pointsOrGroups.reduce((acc, loc, i) => {
							if (!(
								legendInfo &&
								legendInfo.mode === "discreet" &&
								legendInfo.hidden?.includes(loc[legendInfo.field as string])
							)) {
								acc.push(
									<Marker key={i} position={{ lat: loc.decimalLatitude, lng: loc.decimalLongitude }}>
										<PopupWithSearch
											table={table}
											titleTable={titleTable}
											where={where}
											loc={loc}
											id={id}
											legendInfo={legendInfo}
											userDefinedOptions={userDefinedOptions}
											disableSearch={disableSearch}
										/>
									</Marker>
								);

								// if (loc.polylines) {
								// 	acc.push(
								// 		<Polyline
								// 			key={i + "polyline"}
								// 			positions={loc.polylines}
								// 			pathOptions={{ color: getLegendColor(legendInfo, loc, userDefinedOptions).color.hex() }}
								// 		>
								// 			<PopupWithSearch
								// 				table={table}
								// 				titleTable={titleTable}
								// 				where={where}
								// 				loc={loc}
								// 				id={id}
								// 				legendInfo={legendInfo}
								// 				userDefinedOptions={userDefinedOptions}
								// 				disableSearch={disableSearch}
								// 			/>
								// 		</Polyline>
								// 	);
								// }
							}

							return acc;
						}, [] as ReactNode[])}
					</ClusterGroup>
				) : (
					//groups
					<>
						{Object.values(pointsOrGroups).map((locArray, i) => (
							<ClusterGroup
								key={i}
								shapes={shapes}
								pointsInside={pointsInside}
								id={id}
								legendInfo={legendInfo}
								userDefinedOptions={userDefinedOptions}
								pointSize={pointSize}
								pointSizeStep={pointSizeStep}
								radius={clusterRadiusValue ?? 0}
							>
								{locArray.reduce((acc, loc, j) => {
									if (!(
										legendInfo &&
										legendInfo.mode === "discreet" &&
										legendInfo.hidden?.includes(loc[legendInfo.field as string])
									)) {
										acc.push(
											<Marker key={j} position={{ lat: loc.decimalLatitude, lng: loc.decimalLongitude }}>
												<PopupWithSearch
													table={table}
													titleTable={titleTable}
													where={where}
													loc={loc}
													id={id}
													legendInfo={legendInfo}
													userDefinedOptions={userDefinedOptions}
												/>
											</Marker>
										);

										// if (loc.polylines) {
										// 	acc.push(
										// 		<Polyline
										// 			key={j + "polyline"}
										// 			positions={loc.polylines}
										// 			pathOptions={{ color: getLegendColor(legendInfo, loc, userDefinedOptions).color.hex() }}
										// 		>
										// 			<PopupWithSearch
										// 				table={table}
										// 				titleTable={titleTable}
										// 				where={where}
										// 				loc={loc}
										// 				id={id}
										// 				legendInfo={legendInfo}
										// 				userDefinedOptions={userDefinedOptions}
										// 			/>
										// 		</Polyline>
										// 	);
										// }
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
						width: auto !important;
						min-width: 300px;
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
