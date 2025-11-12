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
	// Get current text color from CSS custom property or default
	const textColor = typeof window !== 'undefined' 
		? getComputedStyle(document.documentElement).getPropertyValue('--bc') || '#000000'
		: '#000000';
	
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
						color: `oklch(${textColor})`
					},
					legend: {
						labels: {
							color: `oklch(${textColor})`
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
							color: `oklch(${textColor})`
						},
						grid: {
							color: `oklch(${textColor} / 0.1)`
						}
					},
					y: {
						stacked: true,
						ticks: {
							color: `oklch(${textColor})`
						},
						grid: {
							color: `oklch(${textColor} / 0.1)`
						}
					}
				}
			}}
		></Bar>
	);
}
