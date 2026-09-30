"use client";

import type { SampleModel } from "@/app/generated/prisma/models/Sample";
import { type ReactNode, useMemo, useRef, useState, useTransition } from "react";
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
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import chroma from "chroma-js";
import { DEFAULT_LEGEND_FIELD, DEFAULT_X_FIELD, DEFAULT_Y_FIELD } from "./wrappers/SampleVisualize";

ChartJS.register(TimeScale, LinearScale, PointElement, ScatterController, Title, Tooltip, Legend, zoomPlugin);

type SamplePoint = { x: number | Date; y: number | Date; samp_name: SampleModel["samp_name"] };

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
//TODO: properly label SamplePoints using project_id where necessary
export default function SampleScatterPlot({
	samples,
	fields,
	xyFields,
	userDefinedFields
}: {
	samples: SampleModel[];
	fields: string[];
	xyFields: string[];
	userDefinedFields?: Set<string>;
}) {
	const ref = useRef<ChartJS<"scatter", SamplePoint[]>>(null);

	const { textColor } = useDaisyTheme();
	const gridColor = chroma(textColor).alpha(0.3).hex();

	const [xReverse, setXReverse] = useState(false);
	const [yReverse, setYReverse] = useState(false);

	const [loading, startTransition] = useTransition();

	const [legendField, setLegendField] = useState(DEFAULT_LEGEND_FIELD);
	const [xField, setXField] = useState(() =>
		xyFields.includes(DEFAULT_X_FIELD)
			? DEFAULT_X_FIELD
			: (xyFields.find((f) => f !== DEFAULT_LEGEND_FIELD) as keyof SampleModel)
	);
	const [yField, setYField] = useState(() =>
		xyFields.includes(DEFAULT_Y_FIELD)
			? DEFAULT_Y_FIELD
			: (xyFields.find((f) => f !== DEFAULT_LEGEND_FIELD && f !== xField) as keyof SampleModel)
	);

	const chartInfo = useMemo(() => {
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
					if (userDefinedFields?.has(xField)) {
						const val = p.userDefined?.[xField];
						if (val != null) {
							if (getFieldType(xField) === "number") {
								xVal = Number(val);
							} else {
								xVal = new Date(val);
							}
						}
					} else {
						xVal = p[xField] as typeof xVal;
					}

					if (
						xVal !== null &&
						(typeof xVal === "number"
							? Number.isFinite(xVal) && !(xVal in DeadValueEnum)
							: Number.isFinite(xVal.getTime()) && !(xVal.getTime() in DeadValueEnum))
					) {
						let yVal = null as number | Date | null;
						if (userDefinedFields?.has(yField)) {
							const val = p.userDefined?.[yField];
							if (val) {
								if (getFieldType(yField) === "number") {
									yVal = parseFloat(val);
								} else {
									yVal = new Date(val);
								}
							}
						} else {
							yVal = p[yField] as typeof yVal;
						}

						if (
							yVal !== null &&
							(typeof yVal === "number"
								? Number.isFinite(yVal) && !(yVal in DeadValueEnum)
								: Number.isFinite(yVal.getTime()) && !(yVal.getTime() in DeadValueEnum))
						) {
							const numXVal = typeof xVal === "number" ? xVal : xVal.getTime();
							if (tempXMin == null || numXVal < tempXMin) {
								tempXMin = numXVal;
							}
							if (tempXMax == null || numXVal > tempXMax) {
								tempXMax = numXVal;
							}

							const numYVal = typeof yVal === "number" ? yVal : yVal.getTime();
							if (tempYMin == null || numYVal < tempYMin) {
								tempYMin = numYVal;
							}
							if (tempYMax == null || numYVal > tempYMax) {
								tempYMax = numYVal;
							}

							const label = val.toString();
							const set = acc.find((s) => s.label === label);
							if (set) {
								set.data.push({ x: xVal, y: yVal, samp_name: p.samp_name });
							} else {
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
		distinctColors({ count: tempDatasets.length, chromaMin: 35, lightMin: 35 }).forEach((color, i) => {
			tempDatasets[i]!.borderColor = color.hex();
			tempDatasets[i]!.backgroundColor = color.alpha(0.5).hex();
		});

		const xMin = tempXMin !== undefined && tempXMax !== undefined ? tempXMin - (tempXMax - tempXMin) / 20 : tempXMin;
		const xMax = tempXMin !== undefined && tempXMax !== undefined ? tempXMax + (tempXMax - tempXMin) / 20 : tempXMax;
		const yMin = tempYMin !== undefined && tempYMax !== undefined ? tempYMin - (tempYMax - tempYMin) / 20 : tempYMin;
		const yMax = tempYMin !== undefined && tempYMax !== undefined ? tempYMax + (tempYMax - tempYMin) / 20 : tempYMax;

		return {
			data: { labels: Array.from(labels).sort(), datasets: tempDatasets as DataPoint[] },
			xType: getFieldType(xField),
			xMin,
			xMax,
			yType: getFieldType(yField),
			yMin,
			yMax
		};
	}, [samples, xField, yField, legendField]);

	function getFieldType(newField: keyof SampleModel) {
		if (userDefinedFields?.has(newField)) {
			let tempType = "date" as "number" | "date";

			for (const samp of samples) {
				if (
					samp.userDefined &&
					samp.userDefined[newField] != null &&
					samp.userDefined[newField].trim() !== "" &&
					Number.isFinite(Number(samp.userDefined[newField]))
				) {
					tempType = "number";
					break;
				}
			}

			return tempType;
		} else {
			const type = getZodType("sample", newField).type;

			if (type === "integer" || type === "float") {
				return "number";
			} else {
				return "date";
			}
		}
	}

	return (
		<div className="relative p-6">
			<div className="w-full flex justify-center items-center gap-5">
				<div className="flex justify-center items-center gap-2">
					<fieldset className="fieldset">
						<legend className="fieldset-legend w-full flex justify-between gap-2">
							<span>X-Axis:</span>
							<label className="label select-none">
								Reverse
								<input
									className="checkbox checkbox-sm"
									type="checkbox"
									checked={xReverse}
									onChange={(e) => setXReverse(e.currentTarget.checked)}
									disabled={loading}
								/>
							</label>
						</legend>
						<select
							value={xField}
							onChange={(e) => startTransition(() => setXField(e.currentTarget.value as keyof SampleModel))}
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

					<button
						disabled={loading}
						aria-label="Swap X and Y axes"
						onClick={() =>
							startTransition(() => {
								setXField(yField);
								setYField(xField);
							})
						}
					>
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							xmlns="http://www.w3.org/2000/svg"
							className={`w-8 h-8 mt-7 justify-self-center${loading ? " text-primary/40" : " text-primary cursor-pointer"}`}
						>
							<path fill="currentColor" d="M21 7.5L8 7.5M21 7.5L16.6667 3M21 7.5L16.6667 12" />
							<path fill="currentColor" d="M4 16.5L17 16.5M4 16.5L8.33333 21M4 16.5L8.33333 12" />
						</svg>
					</button>

					<fieldset className="fieldset">
						<legend className="fieldset-legend w-full flex justify-between gap-2">
							<span>Y-Axis:</span>
							<label className="label select-none">
								Reverse
								<input
									className="checkbox checkbox-sm"
									type="checkbox"
									checked={yReverse}
									onChange={(e) => setYReverse(e.currentTarget.checked)}
									disabled={loading}
								/>
							</label>
						</legend>
						<select
							value={yField}
							onChange={(e) => startTransition(() => setYField(e.currentTarget.value as keyof SampleModel))}
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
						onChange={(e) => startTransition(() => setLegendField(e.currentTarget.value as keyof SampleModel))}
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
				data={chartInfo.data}
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
							...(chartInfo.xType === "date"
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
							min: chartInfo.xMin,
							max: chartInfo.xMax,
							reverse: xReverse
						},
						y: {
							...(chartInfo.yType === "date"
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
							min: chartInfo.yMin,
							max: chartInfo.yMax,
							reverse: yReverse
						}
					}
				}}
			/>

			{loading ? <div className="absolute left-0 top-0 w-full h-full bg-black/20 rounded-md"></div> : <></>}
		</div>
	);
}
