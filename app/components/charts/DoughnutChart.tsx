"use client";

import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useTheme } from "next-themes";
import { useState } from "react";
import Link from "next/link";
import distinctColors from "distinct-colors";

ChartJS.register(ArcElement, Tooltip);

interface DoughnutChartProps {
	labels: string[];
	data: number[];
	/**
	 * Compact mode: always stack chart + legend vertically and hide the
	 * informational footer paragraph. Use when the chart is embedded inside
	 * a narrow dashboard card.
	 */
	compact?: boolean;
}

function generateDistinctColors(count: number): string[] {
	if (count === 0) return [];
	return distinctColors({ count, chromaMin: 35, lightMin: 35 }).map((color) => color.hex());
}

function CustomLegend({
	labels,
	data,
	colors,
	textColor,
	hideHeading = false
}: {
	labels: string[];
	data: number[];
	colors: string[];
	textColor: string;
	hideHeading?: boolean;
}) {
	const [showAll, setShowAll] = useState(false);
	const total = data.reduce((sum, value) => sum + value, 0);
	const shouldCollapse = labels.length > 9;
	const displayedItems = shouldCollapse && !showAll ? 9 : labels.length;

	return (
		<div className="flex flex-col gap-3 mt-0 lg:max-h-85 lg:overflow-y-auto pr-2">
			{!hideHeading && (
				<h3 className="text-lg font-semibold mb-2" style={{ color: textColor }}>
					Legend
				</h3>
			)}
			{labels.slice(0, displayedItems).map((label, i) => {
				const percentage = total > 0 ? ((data[i]! / total) * 100).toFixed(1) : "0.0";
				return (
					<div key={i} className="flex items-center gap-3">
						<div className="w-4 h-4 rounded-sm shrink-0" style={{ backgroundColor: colors[i] }} />
						<div className="flex-1 min-w-0 flex items-center gap-1">
							<span className="text-sm font-medium truncate" style={{ color: textColor }} title={label}>
								{label}
							</span>
							<span className="text-sm font-semibold whitespace-nowrap" style={{ color: textColor, opacity: 0.75 }}>
								{percentage}%
							</span>
						</div>
					</div>
				);
			})}

			{shouldCollapse && (
				<button
					onClick={() => setShowAll(!showAll)}
					className="mt-2 px-3 py-1 text-sm rounded-md transition-colors duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2"
					style={{
						backgroundColor: "color-mix(in oklab, var(--color-base-content) 12%, transparent)",
						color: textColor,
						border: "1px solid color-mix(in oklab, var(--color-base-content) 19%, transparent)"
					}}
				>
					{showAll ? "Show Less" : labels.length <= 9 ? "Showing All" : "Show More"}
				</button>
			)}
		</div>
	);
}

export default function DoughnutChart({ labels, data, compact = false }: DoughnutChartProps) {
	const { theme } = useTheme();
	const textColor = "var(--color-base-content)";
	const colors = generateDistinctColors(labels.length);

	const chartData = {
		labels,
		datasets: [
			{
				data,
				backgroundColor: colors,
				borderWidth: 2,
				borderColor: theme === "dark" ? "#1A202C" : "#FFFFFF",
				hoverOffset: 8,
				cutout: "65%" // Creates the doughnut hole
			}
		]
	};

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false // We'll use our custom legend
			},
			tooltip: {
				backgroundColor: theme === "dark" ? "#2D3748" : "#FFFFFF",
				titleColor: textColor,
				bodyColor: textColor,
				borderColor: theme === "dark" ? "#4A5568" : "#E2E8F0",
				borderWidth: 1,
				callbacks: {
					label: function (context: any) {
						const total = context.dataset.data.reduce((sum: number, value: number) => sum + value, 0);
						const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : "0.0";
						return `${context.label}: ${context.parsed} (${percentage}%)`;
					}
				}
			}
		},
		elements: {
			arc: {
				borderWidth: 2
			}
		},
		interaction: {
			intersect: false
		}
	};

	return (
		<div className="w-full h-full flex flex-col">
			<div className={compact ? "flex flex-col items-center gap-5" : "flex flex-col lg:flex-row items-start gap-8"}>
				{/* Chart Container */}
				<div
					className={compact ? "relative h-56 w-56 shrink-0 mx-auto" : "relative h-85 w-75 shrink-0 mx-auto lg:mx-0"}
				>
					<Doughnut data={chartData} options={options} />
				</div>

				{/* Custom Legend */}
				<div className={compact ? "w-full" : "flex-1 min-w-0 lg:max-w-xs"}>
					<CustomLegend labels={labels} data={data} colors={colors} textColor={textColor} hideHeading={compact} />
				</div>
			</div>

			{!compact && (
				<p className="mt-6 text-md text-base-content max-w-xl mx-auto lg:mx-0">
					Assays used on the Ocean DNA Explorer are stored in a GitHub{" "}
					<Link
						href="https://github.com/NOAA-Omics/noaa-omics-metabarcoding-assays"
						target="_blank"
						rel="noopener noreferrer"
						className="underline text-primary"
					>
						repository
					</Link>{" "}
					that defines acceptable assay and target gene information for submissions. You can{" "}
					<Link
						href="https://github.com/NOAA-Omics/noaa-omics-metabarcoding-assays/issues"
						target="_blank"
						rel="noopener noreferrer"
						className="underline text-primary"
					>
						request an assay be added
					</Link>{" "}
					by making a GitHub issue.
				</p>
			)}
		</div>
	);
}
