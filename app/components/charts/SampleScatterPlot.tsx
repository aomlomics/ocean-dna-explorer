"use client";

import { Sample } from "@/app/generated/prisma/client";
import { ReactNode, useEffect, useRef, useState } from "react";
import distinctColors from "distinct-colors";
import { Scatter } from "react-chartjs-2";
import {
	Chart as ChartJS,
	TimeScale,
	LinearScale,
	PointElement,
	Title,
	Tooltip,
	Legend,
	ScatterController
} from "chart.js";
import "chartjs-adapter-date-fns";
import zoomPlugin from "chartjs-plugin-zoom";
import ChartCopyButton from "./ChartCopyButton";
import { DeadValueEnum } from "@/types/enums";
import { getZodType } from "@/app/helpers/schema";
import { SampleSchema } from "@/prisma/generated/zod";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import chroma from "chroma-js";

ChartJS.register(TimeScale, LinearScale, PointElement, ScatterController, Title, Tooltip, Legend, zoomPlugin);

type SamplePoint = { x: number | Date; y: number | Date; samp_name: Sample["samp_name"] };

const POINT_STYLES = {
	borderWidth: 1,
	pointRadius: 5,
	pointHoverRadius: 8
};

type DataPoint = {
	label: string;
	data: SamplePoint[];
	borderColor: string;
	backgroundColor: string;
} & typeof POINT_STYLES;

//TODO: style dates in legend properly (options.plugins.legend.labels.generateLabels)
//TODO: add checklist for legendField
//TODO: store zoom as state, don't reset zoom when changing legendField
export default function SampleScatterPlot({
	samples,
	fields,
	xyFields,
	userDefinedFields
}: {
	samples: Sample[];
	fields: string[];
	xyFields: string[];
	userDefinedFields?: Set<string>;
}) {
	const ref = useRef<ChartJS<"scatter", SamplePoint[]>>(null);

	const { textColor } = useDaisyTheme();
	const gridColor = chroma(textColor).alpha(0.3).hex();

	const [xField, setXField] = useState("eventDate" as keyof Sample);
	const [xType, setXType] = useState("date" as "date" | "number");
	const [xMin, setXMin] = useState(undefined as number | undefined);
	const [xMax, setXMax] = useState(undefined as number | undefined);

	const [yField, setYField] = useState("minimumDepthInMeters" as keyof Sample);
	const [yType, setYType] = useState("number" as "date" | "number");
	const [yMin, setYMin] = useState(undefined as number | undefined);
	const [yMax, setYMax] = useState(undefined as number | undefined);

	const [legendField, setLegendField] = useState("project_id" as keyof Sample);

	const [loading, setLoading] = useState(true);
	const [chartData, setChartData] = useState({ labels: [], datasets: [] } as {
		labels: string[];
		datasets: DataPoint[];
	});

	useEffect(() => {
		if (userDefinedFields?.has(xField)) {
			let tempType = "date" as typeof xType;

			for (const samp of samples) {
				if (samp.userDefined && samp.userDefined[xField] != null) {
					if (!isNaN(parseFloat(samp.userDefined[xField]))) {
						tempType = "number";
						break;
					}
				}
			}

			setXType(tempType);
		} else {
			const type = getZodType("sample", xField).type;

			if (type === "integer" || type === "float") {
				setXType("number");
			} else if (type === "date") {
				setXType("date");
			}
		}
	}, [xField]);

	useEffect(() => {
		if (userDefinedFields?.has(yField)) {
			let tempType = "date" as typeof yType;

			for (const samp of samples) {
				if (samp.userDefined && samp.userDefined[yField] != null) {
					if (!isNaN(parseFloat(samp.userDefined[yField]))) {
						tempType = "number";
						break;
					}
				}
			}

			setYType(tempType);
		} else {
			const type = getZodType("sample", yField).type;

			if (type === "integer" || type === "float") {
				setYType("number");
			} else if (type === "date") {
				setYType("date");
			}
		}
	}, [yField]);

	useEffect(() => {
		const labels = new Set() as Set<string>;

		let tempXMin = undefined as number | undefined;
		let tempXMax = undefined as number | undefined;
		let tempYMin = undefined as number | undefined;
		let tempYMax = undefined as number | undefined;

		//construct datasets using legendField
		const tempDatasets = samples.reduce(
			(acc, p) => {
				let val = null;
				if (userDefinedFields?.has(legendField)) {
					if (p.userDefined) {
						val = p.userDefined[legendField];
					}
				} else {
					val = p[legendField];
				}

				if (val != null && !((val as string | number) in DeadValueEnum) && val !== "") {
					let xVal = null as number | Date | null;
					if (userDefinedFields?.has(xField) && p.userDefined) {
						if (xType === "number") {
							xVal = parseFloat(p.userDefined[xField]);
						} else {
							xVal = new Date(p.userDefined[xField]);
						}
					} else {
						xVal = p[xField] as typeof xVal;
					}

					if (xVal !== null && !(typeof xVal === "number" ? xVal in DeadValueEnum : xVal.getTime() in DeadValueEnum)) {
						let yVal = null as number | Date | null;
						if (userDefinedFields?.has(yField) && p.userDefined) {
							if (yType === "number") {
								yVal = parseFloat(p.userDefined[yField]);
							} else {
								yVal = new Date(p.userDefined[yField]);
							}
						} else {
							yVal = p[yField] as typeof yVal;
						}

						if (
							yVal !== null &&
							!(typeof yVal === "number" ? yVal in DeadValueEnum : yVal.getTime() in DeadValueEnum)
						) {
							const numXVal = typeof xVal === "number" ? xVal : xVal.getTime();
							if (!tempXMin || numXVal < tempXMin) {
								tempXMin = numXVal;
							}
							if (!tempXMax || numXVal > tempXMax) {
								tempXMax = numXVal;
							}

							const numYVal = typeof yVal === "number" ? yVal : yVal.getTime();
							if (!tempYMin || numYVal < tempYMin) {
								tempYMin = numYVal;
							}
							if (!tempYMax || numYVal > tempYMax) {
								tempYMax = numYVal;
							}

							const setIndex = acc.findIndex((s) => s.label === val);
							if (setIndex !== -1) {
								acc[setIndex].data.push({ x: xVal, y: yVal, samp_name: p.samp_name });
							} else {
								const label = val.toString();
								labels.add(label);
								acc.push({
									label,
									data: [{ x: xVal, y: yVal, samp_name: p.samp_name }],
									...POINT_STYLES
								});
							}
						}
					}
				}

				return acc;
			},
			[] as (Omit<DataPoint, "borderColor" | "backgroundColor"> & { borderColor?: string; backgroundColor?: string })[]
		);

		if (tempXMin !== undefined && tempXMax !== undefined) {
			const xBuffer = (tempXMax - tempXMin) / 20;
			setXMin(tempXMin - xBuffer);
			setXMax(tempXMax + xBuffer);
		}

		if (tempYMin !== undefined && tempYMax !== undefined) {
			const yBuffer = (tempYMax - tempYMin) / 20;
			setYMin(tempYMin - yBuffer);
			setYMax(tempYMax + yBuffer);
		}

		//assign colors
		distinctColors({ count: Object.keys(tempDatasets).length }).forEach((color, i) => {
			tempDatasets[i].borderColor = color.hex();
			tempDatasets[i].backgroundColor = color.alpha(0.5).hex();
		});

		setChartData({ labels: Array.from(labels).sort(), datasets: tempDatasets as DataPoint[] });
		setLoading(false);
	}, [xField, yField, legendField]);

	return (
		<div className="relative">
			<div className="w-full flex justify-center items-center gap-5">
				<div className="flex justify-center items-center gap-2">
					<fieldset className="fieldset">
						<legend className="fieldset-legend">X-Axis:</legend>
						<select
							value={xField}
							onChange={(e) => {
								setLoading(true);
								setXField(e.target.value as keyof Sample);
							}}
							className="select"
							disabled={loading}
						>
							{xyFields.reduce((acc, f) => {
								if (f !== yField && f !== legendField) {
									acc.push(
										<option key={f} value={f}>
											{f}
											{userDefinedFields?.has(f) ? " (UD)" : ""}
										</option>
									);
								}

								return acc;
							}, [] as ReactNode[])}
						</select>
					</fieldset>

					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						xmlns="http://www.w3.org/2000/svg"
						className="w-8 h-8 text-primary mt-7 cursor-pointer"
						onClick={() => {
							setLoading(true);
							setXField(yField);
							setYField(xField);
						}}
					>
						<path fill="currentColor" d="M21 7.5L8 7.5M21 7.5L16.6667 3M21 7.5L16.6667 12" />
						<path fill="currentColor" d="M4 16.5L17 16.5M4 16.5L8.33333 21M4 16.5L8.33333 12" />
					</svg>

					<fieldset className="fieldset">
						<legend className="fieldset-legend">Y-Axis:</legend>
						<select
							value={yField}
							onChange={(e) => {
								setLoading(true);
								setYField(e.target.value as keyof Sample);
							}}
							className="select"
							disabled={loading}
						>
							{xyFields.reduce((acc, f) => {
								if (f !== xField && f !== legendField) {
									acc.push(
										<option key={f} value={f}>
											{f}
											{userDefinedFields?.has(f) ? " (UD)" : ""}
										</option>
									);
								}

								return acc;
							}, [] as ReactNode[])}
						</select>
					</fieldset>
				</div>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Color points by:</legend>
					<select
						value={legendField}
						onChange={(e) => {
							setLoading(true);
							setLegendField(e.target.value as keyof Sample);
						}}
						className="select"
						disabled={loading}
					>
						{fields.reduce((acc, f) => {
							if (f !== xField && f !== yField) {
								acc.push(
									<option key={f} value={f}>
										{f}
										{userDefinedFields?.has(f) ? " (UD)" : ""}
									</option>
								);
							}

							return acc;
						}, [] as ReactNode[])}
					</select>
				</fieldset>

				<button className="btn mt-7" onClick={() => ref.current?.resetZoom()} disabled={loading}>
					Reset Zoom
				</button>

				<ChartCopyButton ref={ref} disabled={loading} />
			</div>

			<Scatter
				ref={ref}
				data={chartData}
				options={{
					responsive: true,
					plugins: {
						legend: {
							display: true,
							position: "top",
							labels: {
								color: textColor
							},
							onHover: () => {}
						},
						title: {
							display: true,
							text: `Sample ${yField} vs. ${xField}`,
							color: textColor
						},
						tooltip: {
							callbacks: {
								afterLabel: (ctx) => (ctx.raw as SamplePoint).samp_name
							}
						},
						zoom: {
							zoom: {
								wheel: {
									enabled: true
								},
								pinch: {
									enabled: true
								},
								drag: {
									enabled: true,
									backgroundColor: "rgba(225, 225, 225, 0.3)",
									borderColor: "rgba(225, 225, 225, 0.8)",
									borderWidth: 1
								}
							},
							pan: {
								enabled: true,
								modifierKey: "shift"
							}
						}
					},
					scales: {
						x: {
							...(xType === "date"
								? {
										type: "time",
										time: {
											unit: "day",
											tooltipFormat: "yyyy MMM dd",
											displayFormats: {
												day: "yyyy MMM dd"
											}
										}
									}
								: {}),
							title: {
								display: true,
								text: xField,
								color: textColor
							},
							ticks: {
								color: textColor
							},
							grid: {
								color: gridColor
							},
							min: xMin,
							max: xMax
						},
						y: {
							...(yType === "date"
								? {
										type: "time",
										time: {
											unit: "day",
											tooltipFormat: "yyyy MMM dd",
											displayFormats: {
												day: "yyyy MMM dd"
											}
										}
									}
								: {}),
							title: {
								display: true,
								text: yField,
								color: textColor
							},
							ticks: {
								color: textColor
							},
							grid: {
								color: gridColor
							},
							min: yMin,
							max: yMax
						}
					}
				}}
			/>

			{loading ? <div className="absolute left-0 top-0 w-full h-full bg-black/20 rounded-md"></div> : <></>}
		</div>
	);
}
