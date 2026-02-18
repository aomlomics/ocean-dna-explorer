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

	const [xField, setXField] = useState("eventDate" as keyof Sample);
	const [xType, setXType] = useState("date" as "date" | "number");
	const [yField, setYField] = useState("minimumDepthInMeters" as keyof Sample);
	const [yType, setYType] = useState("number" as "date" | "number");
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
			const type = getZodType(SampleSchema.shape[xField]).type;

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
			const type = getZodType(SampleSchema.shape[yField]).type;

			if (type === "integer" || type === "float") {
				setYType("number");
			} else if (type === "date") {
				setYType("date");
			}
		}
	}, [yField]);

	useEffect(() => {
		const labels = new Set() as Set<string>;
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
							}
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
								text: xField
							},
							ticks: {
								color: textColor
							},
							grid: {
								color: textColor + "1a" // Add low opacity
							}
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
								text: yField
							},
							ticks: {
								color: textColor
							},
							grid: {
								color: textColor + "1a" // Add low opacity
							}
						}
					}
				}}
			/>

			{loading ? <div className="absolute left-0 top-0 w-full h-full bg-black/20 rounded-md"></div> : <></>}
		</div>
	);
}
