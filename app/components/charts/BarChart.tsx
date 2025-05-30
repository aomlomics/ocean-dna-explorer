"use client";

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
						text: title
					}
				},
				responsive: true,
				interaction: {
					intersect: false
				},
				scales: {
					x: {
						stacked: true
					},
					y: {
						stacked: true
					}
				}
			}}
		></Bar>
	);
}
