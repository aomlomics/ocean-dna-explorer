"use client";

import { ReactNode, useEffect, useState } from "react";
import MarkerClusterGroup from "react-leaflet-markercluster";
import {
	DEFAULT_OUTSIDE_COLOR,
	DEFAULT_POINT_SIZE,
	DEFAULT_POINT_SIZE_STEP,
	getLegendColor,
	LegendInfo
} from "./mapUtils";
import { divIcon } from "leaflet";
import { MapShape, MapLocation } from "@/types/globals";
import { TableMetadataValue } from "@/types/tableMetadata";

function getConicGradient(colors: chroma.Color[]) {
	return `conic-gradient(from ${360 / colors.length}deg,${colors
		.map((c, i) => `${c.hex()} 0% ${(100 / colors.length) * (i + 1)}%`)
		.join(",")});`;
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

export default function ClusterGroup({
	shapes,
	pointsInside,
	id,
	legendInfo,
	userDefinedOptions,
	pointSize,
	pointSizeStep,
	radius,
	children
}: {
	shapes: Record<string, MapShape>;
	pointsInside: MapLocation[];
	id: TableMetadataValue["titleField"];
	legendInfo: LegendInfo;
	userDefinedOptions: Set<string>;
	pointSize: number | undefined;
	pointSizeStep: number | undefined;
	radius: number | undefined;
	children: ReactNode;
}) {
	const [version, setVersion] = useState(0);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setVersion((v) => v + 1);
	}, [shapes, legendInfo, pointSize, pointSizeStep, radius]);

	return (
		<MarkerClusterGroup
			key={version}
			maxClusterRadius={radius ?? 0}
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
				if (uniqueHex.length === 1 && !outsideShapesCount) {
					//only one color, no gradient
					const color = Object.values(uniqueColors)[0]!.color;

					html = getMarkerHtml(
						count,
						valuesCount,
						combined,
						`background-color:${color.hex()};`,
						`background-color:${color.alpha(0.5).hex()};`
					);
				} else if (!uniqueHex.length && outsideShapesCount) {
					html = getMarkerHtml(
						count,
						valuesCount,
						combined,
						`background-color:${DEFAULT_OUTSIDE_COLOR.hex()};`,
						`background-color:${DEFAULT_OUTSIDE_COLOR.alpha(0.5).hex()};`
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
