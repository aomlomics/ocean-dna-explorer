"use client";

import { type Dispatch, type RefObject, type SetStateAction, useEffect, useRef } from "react";
import { Chart as ChartJS, type ChartItem, CategoryScale, LinearScale, Title, Tooltip, Legend } from "chart.js";
import { BoxPlotController, BoxAndWiskers } from "@sgratzl/chartjs-chart-boxplot";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import chroma from "chroma-js";
import type { BoxPlotDataPoint } from "@sgratzl/chartjs-chart-boxplot";

export type BoxWhiskerDataset = {
	label?: string;
	data: (BoxPlotDataPoint | null)[];
	borderColor?: string;
	backgroundColor?: string;
};

export type BoxWhiskerData = {
	labels?: string[];
	datasets: BoxWhiskerDataset[];
};

ChartJS.register(CategoryScale, LinearScale, BoxPlotController, BoxAndWiskers, Title, Tooltip, Legend);

export default function BoxWhiskerPlot({
	data,
	ref,
	title,
	xField,
	yField,
	legend,
	onLegendHover,
	showPoints = true
}: {
	data: BoxWhiskerData;
	ref?: RefObject<ChartJS | null>;
	title?: string;
	xField?: string;
	yField?: string;
	legend?: string;
	onLegendHover?: Dispatch<SetStateAction<string | undefined>>;
	showPoints?: boolean;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	//used if ref is not provided
	const chartRef = useRef<ChartJS | null>(null);

	const { textColor } = useDaisyTheme();
	const gridColor = chroma(textColor).alpha(0.3).hex();

	useEffect(() => {
		const currRef = ref === undefined ? chartRef : ref;

		currRef.current = new ChartJS(canvasRef.current as ChartItem, {
			type: "boxplot",
			data,
			options: {
				plugins: {
					title: {
						display: !!title,
						text: title,
						color: textColor
					},
					legend: {
						display: !!legend,
						title: {
							display: !!legend,
							text: legend,
							color: textColor
						},
						labels: {
							color: textColor
						},
						onHover: (event, item) => onLegendHover && onLegendHover(item.text),
						onLeave: () => onLegendHover && onLegendHover(undefined)
					}
				},
				elements: {
					boxandwhiskers: {
						outlierBackgroundColor: chroma(textColor).alpha(0.5).hex(),
						...(showPoints
							? {
									itemBackgroundColor: textColor,
									itemRadius: 2,
									itemHitRadius: 4
								}
							: {})
					}
				},
				scales: {
					x: {
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
						}
					},
					y: {
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
						}
					}
				}
			}
		});

		return () => {
			if (currRef.current) {
				currRef.current.destroy();
			}
		};
	}, [textColor]);

	return <canvas ref={canvasRef} style={{ width: "100%" }} />;
}
