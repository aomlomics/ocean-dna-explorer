"use client";

import { useEffect, useRef } from "react";
import { Chart as ChartJS, ChartItem, CategoryScale, LinearScale, Title, Tooltip, ChartData } from "chart.js";
import { BoxPlotController, BoxAndWiskers } from "@sgratzl/chartjs-chart-boxplot";

ChartJS.register(CategoryScale, LinearScale, BoxPlotController, BoxAndWiskers, Title, Tooltip);

export default function BoxWhiskerPlot({ data }: { data: ChartData }) {
	const chartRef = useRef<ChartJS>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		chartRef.current = new ChartJS(canvasRef.current as ChartItem, {
			type: "boxplot",
			data,
			options: {
				elements: {
					boxandwhiskers: {
						itemRadius: 2,
						itemHitRadius: 4,
						itemBackgroundColor: "blue"
					}
				}
			}
		});

		return () => {
			if (chartRef.current) {
				chartRef.current.destroy();
			}
		};
	}, []);

	return <canvas ref={canvasRef} style={{ width: "100%" }} />;
}
