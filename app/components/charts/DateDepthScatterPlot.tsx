"use client";

import { Sample } from "@/app/generated/prisma/client";
import { useRef, useState } from "react";
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

ChartJS.register(TimeScale, LinearScale, PointElement, ScatterController, Title, Tooltip, Legend, zoomPlugin);

type SamplePoint = { x: Sample["eventDate"]; y: Sample["minimumDepthInMeters"]; samp_name: Sample["samp_name"] };

const POINT_STYLES = {
	borderWidth: 1,
	pointRadius: 5,
	pointHoverRadius: 8
};

export default function DateDepthScatterPlog({
	points,
	fields,
	userDefinedFields
}: {
	points: Sample[];
	fields: Set<keyof Sample>;
	userDefinedFields: Set<string>;
}) {
	const ref = useRef<ChartJS<"scatter", SamplePoint[]>>(null);
	const [legendField, setLegendField] = useState("project_id");

	//construct datasets using legendField
	const datasets = points.reduce(
		(acc, p) => {
			const val =
				p.userDefined && userDefinedFields.has(legendField)
					? p.userDefined[legendField]
					: p[legendField as keyof Sample];

			if (val != null) {
				const setIndex = acc.findIndex((s) => s.label === val);
				if (setIndex !== -1) {
					acc[setIndex].data.push({ x: p.eventDate, y: p.minimumDepthInMeters, samp_name: p.samp_name });
				} else {
					acc.push({
						label: val.toString(),
						data: [{ x: p.eventDate, y: p.minimumDepthInMeters, samp_name: p.samp_name }],
						...POINT_STYLES
					});
				}
			}

			return acc;
		},
		[] as ({
			label: string;
			data: SamplePoint[];
			borderColor?: string;
			backgroundColor?: string;
		} & typeof POINT_STYLES)[]
	);

	//assign colors
	distinctColors({ count: Object.keys(datasets).length }).forEach((color, i) => {
		datasets[i].borderColor = color.hex();
		datasets[i].backgroundColor = color.alpha(0.5).hex();
	});

	return (
		<>
			<div className="w-full flex justify-center items-center gap-5">
				<button className="btn mt-7" onClick={() => ref.current?.resetZoom()}>
					Reset Zoom
				</button>

				<ChartCopyButton ref={ref} />

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Color points by:</legend>
					<select value={legendField} onChange={(e) => setLegendField(e.target.value)} className="select">
						{Array.from(fields).map((f) => (
							<option key={f}>{f}</option>
						))}
						{Array.from(userDefinedFields).map((f) => (
							<option key={f} value={f}>
								{f} (UD)
							</option>
						))}
					</select>
				</fieldset>
			</div>

			<Scatter
				ref={ref}
				data={{ datasets }}
				options={{
					responsive: true,
					plugins: {
						legend: {
							display: true,
							position: "top"
						},
						title: {
							display: true,
							text: "Sample Depth vs. Event Date"
						},
						tooltip: {
							callbacks: {
								afterLabel: (ctx) => points[ctx.dataIndex].samp_name
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
								},
								mode: "xy"
							},
							pan: {
								enabled: true,
								mode: "xy",
								modifierKey: "shift"
							}
						}
					},
					scales: {
						x: {
							type: "time",
							time: {
								unit: "day",
								tooltipFormat: "yyyy MMM dd",
								displayFormats: {
									day: "yyyy MMM dd"
								}
							},
							title: {
								display: true,
								text: "eventDate"
							},
							ticks: {
								maxTicksLimit: 10
							}
						},
						y: {
							beginAtZero: true,
							reverse: true, // Reverse Y-axis so deeper depths appear lower
							title: {
								display: true,
								text: "minimumDepthInMeters"
							}
						}
					}
				}}
			/>
		</>
	);
}
