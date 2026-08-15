"use client";

import { MapContainer, TileLayer, Marker, FeatureGroup } from "react-leaflet";
import {
	LatLng,
	FeatureGroup as LFeatureGroup,
	Map,
	Polygon as LPolygon,
	Circle as LCircle,
	LatLngBoundsExpression
} from "leaflet";
import { FullscreenControl } from "react-leaflet-fullscreen";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "react-leaflet-fullscreen/styles.css";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Prisma } from "@/app/generated/prisma/client";
import TableMetadata, { TableMetadataValue } from "@/types/tableMetadata";
import { EditControl } from "react-leaflet-draw-next";
import { circleToString, getLocationsInsideShapes, getShapesFromUrl, polygonToString } from "@/app/helpers/utils";
import { MapLocationWithValues, MapLocation, NullLocation, MapShape } from "@/types/globals";
import { Color } from "chroma-js";
import distinctColors from "distinct-colors";
import { DeadValueEnum, DeadValueNumbers } from "@/types/enums";
import { GlobalOmit } from "@/types/objects";
import { getZodType } from "@/app/helpers/schema";
import { usePathname, useSearchParams } from "next/navigation";
import LegendControl from "./controls/LegendControl";
import PointSizeControl from "./controls/PointSizeControl";
import ClusterControl from "./controls/ClusterControl";
import DrawSelectedControl from "./controls/DrawSelectControl";
import PopupWithSearch from "./popups/PopupWithSearch";
import {
	DEFAULT_CLUSTER_RADIUS,
	DEFAULT_COLOR,
	DEFAULT_PALETTE,
	DEFAULT_POINT_SIZE,
	DEFAULT_POINT_SIZE_STEP,
	getLegendValue,
	LEGEND_VALUES_LIMIT,
	LegendInfo,
	legendValueSort
} from "./utils/mapUtils";
import LoadingControl from "./controls/LoadingControl";
import RecenterControl from "./controls/RecenterControl";
import NoLocationPointsControl from "./controls/NoLocationPointControl";
import ClusterGroup from "./utils/ClusterGroup";

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

const lightMin = 35;
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

	function getMapLegendField(field: string): LegendInfo {
		if (userDefinedOptions.has(field)) {
			//get unique options
			const options = new Set() as Set<any>;
			let someNoData = false;

			for (const loc of reducedPoints) {
				if (loc.values) {
					for (const val of loc.values) {
						if (val.userDefined[field] != null && val.userDefined[field] !== "") {
							options.add(val.userDefined[field]);
						} else {
							someNoData = true;
						}
					}
				} else if (loc.userDefined[field] != null && loc.userDefined[field] !== "") {
					options.add(loc.userDefined[field]);
				} else {
					someNoData = true;
				}
			}

			const optionsArray = Array.from(options).sort(legendValueSort);

			//check if invalid number of options
			if (optionsArray.length === 0 || (optionsArray.length === 1 && optionsArray[0] == null)) {
				return { field, mode: "discreet", colorMap: {} };
			} else if (optionsArray.length === 1) {
				return { field, mode: "discreet", colorMap: { [optionsArray[0]]: DEFAULT_COLOR } };
			} else if (optionsArray.length > LEGEND_VALUES_LIMIT) {
				return { field, mode: "discreet", colorMap: {}, tooManyOptions: true };
			} else {
				//valid
				const colors = distinctColors({ count: optionsArray.length, chromaMin, lightMin });
				const colorMap = optionsArray.reduce(
					(acc, opt, i) => ({ ...acc, [opt]: colors[i]! }),
					{} as Record<string, Color>
				);

				//add default color if there is some point with no data
				if (someNoData) {
					colorMap["No value"] = DEFAULT_COLOR;
				}

				return { field, mode: "discreet", colorMap };
			}
		} else {
			const type = getZodType(table, field).type;

			if (type === "string" || type === "DeadBoolean") {
				//get unique options
				const options = new Set() as Set<any>;
				let someNoData = false;

				for (const loc of reducedPoints) {
					if (loc.values) {
						for (const val of loc.values) {
							if (val[field]) {
								options.add(val[field]);
							} else {
								someNoData = true;
							}
						}
					} else if (loc[field]) {
						options.add(loc[field]);
					} else {
						someNoData = true;
					}
				}
				const optionsArray = Array.from(options).sort(legendValueSort);

				//check if invalid number of options
				if (optionsArray.length === 0 || (optionsArray.length === 1 && optionsArray[0] == null)) {
					return { field, mode: "discreet", colorMap: {} };
				} else if (optionsArray.length === 1) {
					return { field, mode: "discreet", colorMap: { [optionsArray[0]]: DEFAULT_COLOR } };
				} else if (optionsArray.length > LEGEND_VALUES_LIMIT) {
					return { field, mode: "discreet", colorMap: {}, tooManyOptions: true };
				} else {
					//valid
					const colors = distinctColors({ count: optionsArray.length, chromaMin, lightMin });
					const colorMap = optionsArray.reduce(
						(acc, opt, i) => ({ ...acc, [opt]: colors[i]! }),
						{} as Record<string, Color>
					);

					//add default color if there is some point with no data
					if (someNoData) {
						colorMap["No value"] = DEFAULT_COLOR;
					}

					return { field, mode: "discreet", colorMap };
				}
			} else if (type === "integer" || type === "float") {
				//get unique options
				const options = new Set() as Set<any>;
				let someNoValue = false;

				for (const loc of reducedPoints) {
					if (loc.values) {
						for (const val of loc.values) {
							if (val[field] != null && !DeadValueNumbers.includes(val[field])) {
								options.add(val[field]);
							} else {
								someNoValue = true;
							}
						}
					} else {
						if (loc[field] != null && !DeadValueNumbers.includes(loc[field])) {
							options.add(loc[field]);
						} else {
							someNoValue = true;
						}
					}
				}
				const optionsArray = Array.from(options).sort((a, b) => a - b);

				//check if invalid number of options
				if (optionsArray.length === 0 || (optionsArray.length === 1 && optionsArray[0] == null)) {
					return { field, mode: "discreet", colorMap: {} };
				} else if (optionsArray.length === 1) {
					return { field, mode: "discreet", colorMap: { [optionsArray[0]]: DEFAULT_COLOR } };
				} else {
					//valid
					return {
						field,
						mode: "gradient",
						range: [optionsArray[0], optionsArray[optionsArray.length - 1]],
						palette: legendInfo?.mode === "gradient" ? legendInfo.palette : DEFAULT_PALETTE,
						someNoValue
					};
				}
			} else if (type === "date") {
				//get unique options and cast to epoch timestamp
				const options = new Set() as Set<any>;
				let someNoValue = false;

				for (const loc of reducedPoints) {
					if (loc.values) {
						for (const val of loc.values) {
							if (val[field]) {
								const time = typeof val[field] === "string" ? new Date(val[field]).getTime() : val[field].getTime();
								if (!DeadValueNumbers.includes(time)) {
									options.add(time);
								} else {
									someNoValue = true;
								}
							} else {
								someNoValue = true;
							}
						}
					} else {
						if (loc[field]) {
							const time = typeof loc[field] === "string" ? new Date(loc[field]).getTime() : loc[field].getTime();
							if (!DeadValueNumbers.includes(time)) {
								options.add(time);
							} else {
								someNoValue = true;
							}
						} else {
							someNoValue = true;
						}
					}
				}
				const optionsArray = Array.from(options).sort((a, b) => a - b);

				//check if invalid number of options
				if (
					optionsArray.length === 0 ||
					(optionsArray.length === 1 && (optionsArray[0] == null || isNaN(optionsArray[0])))
				) {
					return { field, mode: "discreet", colorMap: {} };
				} else if (optionsArray.length === 1) {
					return { field, mode: "discreet", colorMap: { [optionsArray[0]]: DEFAULT_COLOR } };
				} else {
					//valid
					return {
						field,
						mode: "gradient",
						range: [new Date(optionsArray[0]), new Date(optionsArray[optionsArray.length - 1])],
						palette: legendInfo?.mode === "gradient" ? legendInfo.palette : DEFAULT_PALETTE,
						someNoValue
					};
				}
			} else {
				return {
					field,
					mode: "discreet",
					colorMap: { "Unsupported field": DEFAULT_COLOR }
				};
			}
		}
	}

	//make legend options follow fieldOrder
	const legendOptions = [];
	const omit = [...legendOmit, ...GlobalOmit, "id", "userDefined"];
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
		defaultLegend = getMapLegendField(defaultLegendField);
	}

	const [legendInfo, setLegendInfo] = useState(defaultLegend);
	const [loading, setLoading] = useState(false);
	const [pointsInside, setPointsInside] = useState([] as MapLocation[]);

	const [pointSize, setPointSize] = useState(DEFAULT_POINT_SIZE as number | undefined);
	const [pointSizeStep, setPointSizeStep] = useState(DEFAULT_POINT_SIZE_STEP as number | undefined);
	const [clusterRadiusValue, setClusterRadiusValue] = useState(
		(clusterRadius || DEFAULT_CLUSTER_RADIUS) as number | undefined
	);

	const [shapes, setShapes] = useState({} as Record<string, MapShape>);

	function checkShapes() {
		if (Object.keys(shapes).length) {
			setPointsInside(
				getLocationsInsideShapes(
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
				)
			);
		} else {
			setPointsInside([]);
		}
	}

	//shapes
	useEffect(() => {
		if (drawReady) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			checkShapes();

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
		checkShapes();
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
						getMapLegendField={getMapLegendField}
						setLoading={setLoading}
						legendOptions={legendOptions}
						userDefinedOptions={userDefinedOptions}
						mapRef={mapRef}
						defaultLegend={defaultLegend}
						titleTable={titleTable}
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
							if (
								!(
									legendInfo &&
									legendInfo.mode === "discreet" &&
									legendInfo.hidden?.includes(loc[legendInfo.field as string])
								)
							) {
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
