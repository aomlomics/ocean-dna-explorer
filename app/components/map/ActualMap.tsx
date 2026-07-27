"use client";

import { MapContainer, TileLayer, Marker, FeatureGroup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import {
	divIcon,
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
import { LocationWithValues, Location, NullLocation, MapShape } from "@/types/globals";
import chroma, { Color } from "chroma-js";
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
	DEFAULT_OUTSIDE_COLOR,
	DEFAULT_PALETTE,
	DEFAULT_POINT_SIZE,
	DEFAULT_POINT_SIZE_STEP,
	getLegendColor,
	getLegendValue,
	LegendInfo
} from "./utils/mapUtils";
import LoadingControl from "./controls/LoadingControl";
import RecenterControl from "./controls/RecenterControl";
import NoLocationPointsControl from "./controls/NoLocationPointControl";

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

function getConicGradient(colors: chroma.Color[]) {
	return `conic-gradient(from ${360 / colors.length}deg,${colors
		.map((c, i) => `${c.hex()} 0% ${(100 / colors.length) * (i + 1)}%`)
		.join(",")});`;
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

function getMarkerHtml(count: number, valuesCount: number, combined: number, style: string, borderStyle?: string) {
	const sharedClassName = "h-full w-full rounded-full";
	const borderClassName = "border border-black";
	const tooltipClassName = "tooltip tooltip-secondary before:text-primary-content";

	if (count === 1 && !valuesCount) {
		return `<div class='${sharedClassName} ${borderClassName}' style='${style}'></div>`;
	} else {
		if (count === 1) {
			return `<div class='${sharedClassName} ${borderClassName} ${tooltipClassName}' data-tip='${valuesCount}' style='${style}'></div>`;
		} else {
			if (borderStyle) {
				return (
					`<div class='p-1 ${sharedClassName} ${tooltipClassName}' data-tip='${combined}' style='${borderStyle}'>` +
					`<div class='${sharedClassName}' style='${style}'></div>` +
					`</div>`
				);
			}

			return `<div class='border-4 border-white/40 ${sharedClassName} ${tooltipClassName}' data-tip='${combined}' style='${style}'></div>`;
		}
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

	//clump locations if they have identical latlng
	let filteredLocations = [] as Array<Location | LocationWithValues>;
	//track points with invalid location data
	let noLocationPoints = [] as NullLocation[];
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
		if (
			locations[0].decimalLatitude !== null &&
			locations[0].decimalLongitude !== null &&
			!(locations[0].decimalLatitude! in DeadValueEnum) &&
			!(locations[0].decimalLongitude! in DeadValueEnum)
		) {
			mapProps = {
				center: [locations[0].decimalLatitude, locations[0].decimalLongitude] as unknown as LatLng,
				zoom: 5
			};

			filteredLocations.push(locations[0] as Location);
		} else {
			noLocationPoints.push(locations[0]);
			mapProps = { bounds: DEFAULT_BOUNDS };
		}

		if (locations[0].userDefined) {
			for (const opt in locations[0].userDefined) {
				userDefinedOptions.add(opt);
			}
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
						defaultOptions.add(getLegendValue(TableMetadata[titleTable].titleField, loc, userDefinedOptions));
					}

					filteredLocations.push(loc);
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
		const optionsArray = Array.from(defaultOptions);
		const colors = distinctColors({ count: optionsArray.length, chromaMin, lightMin });
		const colorMap = {} as Record<string, Color>;
		for (let i = 0; i < optionsArray.length; i++) {
			colorMap[optionsArray[i]] = colors[i];
		}
		defaultLegend = { field: titleId, mode: "discreet", colorMap };

		//assemble locations object with assigned color and list of locations
		pointsOrGroups = {} as Record<string, LocationWithValues[]>;
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
			const optionsArray = Array.from(options).sort((a, b) => a.localeCompare(b));

			//check if invalid number of options
			if (optionsArray.length === 0 || (optionsArray.length === 1 && optionsArray[0] == null)) {
				return { field, mode: "discreet", colorMap: {} };
			} else if (optionsArray.length === 1) {
				return { field, mode: "discreet", colorMap: { [optionsArray[0]]: DEFAULT_COLOR } };
			} else {
				//valid
				const colors = distinctColors({ count: optionsArray.length, chromaMin, lightMin });
				const colorMap = {} as Record<string, Color>;
				for (let i = 0; i < optionsArray.length; i++) {
					colorMap[optionsArray[i]] = colors[i];
				}

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
				const optionsArray = Array.from(options).sort((a, b) => a.localeCompare(b));

				//check if invalid number of options
				if (optionsArray.length === 0 || (optionsArray.length === 1 && optionsArray[0] == null)) {
					return { field, mode: "discreet", colorMap: {} };
				} else if (optionsArray.length === 1) {
					return { field, mode: "discreet", colorMap: { [optionsArray[0]]: DEFAULT_COLOR } };
				} else {
					//valid
					const colors = distinctColors({ count: optionsArray.length, chromaMin, lightMin });
					const colorMap = {} as Record<string, Color>;
					for (let i = 0; i < optionsArray.length; i++) {
						colorMap[optionsArray[i]] = colors[i];
					}

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
								const time = val[field].getTime();
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
							const time = loc[field].getTime();
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
	const [pointsInside, setPointsInside] = useState([] as Location[]);

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
					const uniqueColors = {} as Record<string, { color: chroma.Color; percent?: number }>; //key is hex
					const colorsArray = [] as chroma.Color[];
					for (const marker of cluster.getAllChildMarkers()) {
						count++;

						//TODO: make colors have less alpha when outside shapes instead of turning them black
						const loc = marker.options.children.props.loc;
						if (loc.values) {
							childrenWithValues++;
							valuesCount += loc.values.length;

							//check if location is outside any drawn shapes
							if (
								Object.keys(shapes).length &&
								pointsInside &&
								pointsInside.find((p) =>
									typeof id === "string" ? p[id] === loc[id] : id.every((f) => p[f] === loc[f])
								) === undefined
							) {
								outsideShapesCount += loc.values.length;
							} else {
								for (const val of loc.values) {
									const { color, percent } = getLegendColor(legendInfo, val, userDefinedOptions);
									uniqueColors[color.hex()] = { color, percent };
									colorsArray.push(color);
								}
							}
						} else {
							//check if location is outside any drawn shapes
							if (
								Object.keys(shapes).length &&
								pointsInside &&
								pointsInside.find((p) =>
									typeof id === "string" ? p[id] === loc[id] : id.every((f) => p[f] === loc[f])
								) === undefined
							) {
								outsideShapesCount++;
							} else {
								const { color, percent } = getLegendColor(legendInfo, loc, userDefinedOptions);
								uniqueColors[color.hex()] = { color, percent };
								colorsArray.push(color);
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
					const uniqueHex = Object.keys(uniqueColors);
					if ((uniqueHex.length === 1 && !outsideShapesCount) || (!uniqueHex.length && outsideShapesCount)) {
						//only one color, no gradient
						let color;
						if (outsideShapesCount) {
							color = DEFAULT_OUTSIDE_COLOR;
						} else {
							color = Object.values(uniqueColors)[0].color;
						}

						html = getMarkerHtml(
							count,
							valuesCount,
							combined,
							`background-color:${color.hex()};`,
							`background-color:${color.alpha(0.5).hex()};`
						);
					} else {
						//more than one color, display as gradient
						let orderedColors;

						if (legendInfo?.mode === "discreet") {
							orderedColors = Object.values(legendInfo.colorMap).filter((color) => uniqueHex.includes(color.hex()));
						} else {
							//gradient
							orderedColors = Object.values(uniqueColors)
								.sort((c1, c2) => {
									if (c1.percent && c2.percent) {
										return c1.percent - c2.percent;
									} else {
										let val = 0;

										if (!c1.percent) {
											val++;
										}
										if (!c2.percent) {
											val--;
										}

										return val;
									}
								})
								.map((obj) => obj.color);
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
							`background:${getConicGradient(orderedColors)};`,
							`background:${getConicGradient(orderedColors.map((color) => color.alpha(0.5)))};`
							// `background:${getConicGradient(orderedColors.map((color) => color.mix("white", 0.4, "oklab")))};`
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
					{draw && drawReady && featureGroupRef.current && (
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
							featureGroup={featureGroupRef.current}
						/>
					)}
				</FeatureGroup>

				{Array.isArray(pointsOrGroups) ? (
					//points
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
										<PopupWithSearch
											table={table}
											titleTable={titleTable}
											where={where}
											loc={loc}
											id={id}
											legendInfo={legendInfo}
											userDefinedOptions={userDefinedOptions}
											disableSearch={disableSearch}
											maxWidth={mapRef.current ? mapRef.current.getContainer().clientWidth * 0.5 : undefined}
										/>
									</Marker>
								);
							}

							return acc;
						}, [] as ReactNode[])}
					</ClusterGroup>
				) : (
					//groups
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
													where={where}
													loc={loc}
													id={id}
													legendInfo={legendInfo}
													userDefinedOptions={userDefinedOptions}
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
