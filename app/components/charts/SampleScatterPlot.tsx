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

export default function SampleScatterPlog({
	samples,
	fields,
	xyFields
}: {
	samples: Sample[];
	fields: (keyof Sample)[];
	xyFields: (keyof Sample)[];
}) {
	const ref = useRef<ChartJS<"scatter", SamplePoint[]>>(null);

	const { textColor } = useDaisyTheme();

	const [xField, setXField] = useState("eventDate" as keyof Sample);
	const [xType, setXType] = useState("date" as "date" | "number");
	const [yField, setYField] = useState("minimumDepthInMeters" as keyof Sample);
	const [yType, setYType] = useState("number" as "date" | "number");
	const [legendField, setLegendField] = useState("project_id" as keyof Sample);

	const [datasets, setDatasets] = useState(undefined as DataPoint[] | undefined);

	useEffect(() => {
		const type = getZodType(SampleSchema.shape[xField]).type;

		if (type === "integer" || type === "float") {
			setXType("number");
		} else if (type === "date") {
			setXType("date");
		}
	}, [xField]);

	useEffect(() => {
		const type = getZodType(SampleSchema.shape[yField]).type;

		if (type === "integer" || type === "float") {
			setYType("number");
		} else if (type === "date") {
			setYType("date");
		}
	}, [yField]);

	useEffect(() => {
		//construct datasets using legendField
		const tempDatasets = samples.reduce(
			(acc, p) => {
				const val = p[legendField as keyof Sample];

				if (val !== null) {
					const setIndex = acc.findIndex((s) => s.label === val);
					const xVal = p[xField] as number | Date | null;
					const yVal = p[yField] as number | Date | null;

					if (
						xVal !== null &&
						!(typeof xVal === "number" ? xVal in DeadValueEnum : xVal.getTime() in DeadValueEnum) &&
						yVal !== null &&
						!(typeof yVal === "number" ? yVal in DeadValueEnum : yVal.getTime() in DeadValueEnum)
					) {
						if (setIndex !== -1) {
							acc[setIndex].data.push({ x: xVal, y: yVal, samp_name: p.samp_name });
						} else {
							acc.push({
								label: val.toString(),
								data: [{ x: xVal, y: yVal, samp_name: p.samp_name }],
								...POINT_STYLES
							});
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

		setDatasets(tempDatasets as DataPoint[]);
	}, [xField, yField, legendField]);

	return (
		<>
			<div className="w-full flex justify-center items-center gap-5">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">X-Axis:</legend>
					<select value={xField} onChange={(e) => setXField(e.target.value as keyof Sample)} className="select">
						{xyFields.reduce((acc, f) => {
							if (f !== yField && f !== legendField) {
								acc.push(<option key={f}>{f}</option>);
							}

							return acc;
						}, [] as ReactNode[])}
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Y-Axis:</legend>
					<select value={yField} onChange={(e) => setYField(e.target.value as keyof Sample)} className="select">
						{xyFields.reduce((acc, f) => {
							if (f !== xField && f !== legendField) {
								acc.push(<option key={f}>{f}</option>);
							}

							return acc;
						}, [] as ReactNode[])}
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Color points by:</legend>
					<select
						value={legendField}
						onChange={(e) => setLegendField(e.target.value as keyof Sample)}
						className="select"
					>
						{fields.reduce((acc, f) => {
							if (f !== xField && f !== yField) {
								acc.push(<option key={f}>{f}</option>);
							}

							return acc;
						}, [] as ReactNode[])}
					</select>
				</fieldset>

				<button className="btn mt-7" onClick={() => ref.current?.resetZoom()}>
					Reset Zoom
				</button>

				<ChartCopyButton ref={ref} />
			</div>

			{datasets ? (
				<Scatter
					ref={ref}
					data={{ datasets }}
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
								text: "Sample Depth vs. Event Date",
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
			) : (
				<></>
			)}
		</>
	);
}
