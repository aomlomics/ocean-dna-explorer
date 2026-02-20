"use client";

import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import {
	Chart as ChartJS,
	ChartDataset,
	BarController,
	BarElement,
	LinearScale,
	CategoryScale,
	Legend,
	Tooltip,
	Title
} from "chart.js";
ChartJS.register(BarController, BarElement, LinearScale, CategoryScale, Tooltip, Legend, Title);
import { Bar } from "react-chartjs-2";

export default function BarChart({
	title,
	labels,
	datasets
}: {
	title: string;
	labels: string[];
	datasets: ChartDataset<"bar", (number | [number, number] | null)[]>[];
}) {
	const { textColor } = useDaisyTheme();

	return (
		<Bar
			data={{
				labels,
				datasets
			}}
			options={{
				plugins: {
					title: {
						display: true,
						text: title,
						color: textColor
					},
					legend: {
						labels: {
							color: textColor
						}
					}
				},
				responsive: true,
				interaction: {
					intersect: false
				},
				scales: {
					x: {
						stacked: true,
						ticks: {
							color: textColor
						},
						grid: {
							color: textColor + "1a" // Add low opacity
						}
					},
					y: {
						stacked: true,
						ticks: {
							color: textColor
						},
						grid: {
							color: textColor + "1a" // Add low opacity
						}
					}
				}
			}}
		></Bar>
	);
}
