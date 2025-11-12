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
import { useEffect, useState } from "react";

export default function BarChart({
	title,
	labels,
	datasets
}: {
	title: string;
	labels: string[];
	datasets: ChartDataset<"bar", (number | [number, number] | null)[]>[];
}) {
	const [textColor, setTextColor] = useState("currentColor");
	
	useEffect(() => {
		// Get the actual computed color value
		const updateColor = () => {
			const color = getComputedStyle(document.documentElement).getPropertyValue('color') || 
				           getComputedStyle(document.body).color;
			setTextColor(color);
		};
		
		updateColor();
		
		// Listen for theme changes
		const observer = new MutationObserver(updateColor);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});
		
		return () => observer.disconnect();
	}, []);
	
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
							color: textColor + '1a' // Add low opacity
						}
					},
					y: {
						stacked: true,
						ticks: {
							color: textColor
						},
						grid: {
							color: textColor + '1a' // Add low opacity
						}
					}
				}
			}}
		></Bar>
	);
}
