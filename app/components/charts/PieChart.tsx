"use client";

import { Chart as ChartJS, ArcElement, Legend, Tooltip, Title } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

export default function PieChart({
	title,
	labels,
	datasets,
	textColor
}: {
	title?: string;
	labels: string[];
	datasets: {
		label: string;
		data: number[];
		backgroundColor: string[];
	}[];
	textColor: string;
}) {
	return (
		<Pie
			data={{
				labels,
				datasets
			}}
			options={{
				plugins: {
					title: {
						display: !!title,
						text: title,
						color: textColor,
						font: {
							family: "inherit",
							size: 28,
							weight: "bold"
						}
					},
					legend: {
						position: "bottom",
						labels: {
							color: textColor,
							font: {
								family: "inherit",
								size: 40,
								weight: "bold"
							},
							padding: 30,
							usePointStyle: true,
							pointStyle: "circle"
						}
					}
				},
				responsive: true,
				maintainAspectRatio: false
			}}
		/>
	);
}
