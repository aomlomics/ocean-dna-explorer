"use client";

import { RefObject, useEffect, useRef } from "react";
import { Chart as ChartJS, ChartItem, CategoryScale, LinearScale, Title, Tooltip, ChartData } from "chart.js";
import { BoxPlotController, BoxAndWiskers } from "@sgratzl/chartjs-chart-boxplot";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import chroma from "chroma-js";
import { AlphaDiversity } from "@/app/generated/prisma/client";

ChartJS.register(CategoryScale, LinearScale, BoxPlotController, BoxAndWiskers, Title, Tooltip);

export default function BoxWhiskerPlot({
	ref,
	alphaDiversity,
	field,
	data
}: {
	ref: RefObject<ChartJS<any> | null>;
	alphaDiversity: { indexType: AlphaDiversity["indexType"]; depth: AlphaDiversity["depth"] };
	field: string;
	data: ChartData;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const { textColor } = useDaisyTheme();
	const gridColor = chroma(textColor).alpha(0.3).hex();

	useEffect(() => {
		ref.current = new ChartJS(canvasRef.current as ChartItem, {
			type: "boxplot",
			data,
			options: {
				plugins: {
					title: {
						display: true,
						text: `${alphaDiversity.indexType.slice(0, 1).toUpperCase() + alphaDiversity.indexType.slice(1)} Alpha Diversity${alphaDiversity.depth ? " at " + alphaDiversity.depth + " depth" : ""} by ${field}`,
						color: textColor
					}
				},
				elements: {
					boxandwhiskers: {
						itemRadius: 2,
						itemHitRadius: 4,
						itemBackgroundColor: textColor
					}
				},
				scales: {
					x: {
						title: {
							display: true,
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
			if (ref.current) {
				ref.current.destroy();
			}
		};
	}, [textColor]);

	return <canvas ref={canvasRef} style={{ width: "100%" }} />;
}
