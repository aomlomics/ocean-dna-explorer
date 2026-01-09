"use client";

import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useTheme } from "next-themes";
import { useState, useMemo, useEffect } from "react";
import { useThrottledCallback } from "use-debounce";
import Link from "next/link";
import distinctColors from "distinct-colors";

ChartJS.register(ArcElement, Tooltip);

interface TaxonomyDonutChartProps {
	labels: string[];
	data: number[];
	sampName: string;
}

function generateDistinctColors(count: number): string[] {
	if (count === 0) return [];

	const colors = distinctColors({
		count: count,
		hueMin: 0,
		hueMax: 360,
		lightMin: 30,
		lightMax: 80,
		chromaMin: 40,
		chromaMax: 90,
		quality: 100
	});

	return colors.map((color) => color.hex());
}

function CustomLegend({
	labels,
	data,
	colors,
	textColor,
	sampName,
	otherThreshold,
	setOtherThreshold
}: {
	labels: string[];
	data: number[];
	colors: string[];
	textColor: string;
	sampName: string;
	otherThreshold: number;
	setOtherThreshold: (value: number) => void;
}) {
	const total = data.reduce((sum, value) => sum + value, 0);

	// Throttle the threshold changes for smooth slider experience
	// Throttle fires at regular intervals while dragging, giving immediate feedback
	const throttledSetOtherThreshold = useThrottledCallback(
		(value: number) => {
			setOtherThreshold(value);
		},
		100
	);

	// Group items based on threshold
	const { displayedItems, otherCount } = useMemo(() => {
		const thresholdPercentage = otherThreshold;
		let otherSum = 0;
		const displayed = [];

		for (let i = 0; i < labels.length; i++) {
			const percentage = total > 0 ? (data[i] / total) * 100 : 0;
			if (percentage >= thresholdPercentage) {
				displayed.push(i);
			} else {
				otherSum += data[i];
			}
		}

		return {
			displayedItems: displayed,
			otherCount: otherSum
		};
	}, [data, labels.length, total, otherThreshold]);

	const otherPercentage = total > 0 ? ((otherCount / total) * 100).toFixed(1) : "0.0";

	return (
		<div className="flex flex-col gap-4 mt-0 h-full">
			{/* Threshold Control */}
			<div className="flex flex-col gap-3 pb-3" style={{ borderColor: textColor + "20" }}>
				<label className="text-xs uppercase font-semibold tracking-wide" style={{ color: textColor + "99" }}>
					Group items below (%)
				</label>
				<div className="flex items-center gap-3">
					<input
						type="number"
						min="0"
						max="5"
						step="0.1"
						value={otherThreshold}
						onChange={(e) => setOtherThreshold(parseFloat(e.target.value) || 0)}
						className="w-16 px-2 py-1.5 text-sm rounded border transition-colors"
						style={{
							borderColor: "#64ABDC",
							color: textColor,
							backgroundColor: "#64ABDC" + "25"
						}}
					/>
					<input
						type="range"
						min="0"
						max="5"
						step="0.1"
						value={otherThreshold}
						onChange={(e) => throttledSetOtherThreshold(parseFloat(e.target.value))}
						className="flex-1 h-2 rounded-lg appearance-none"
						style={{
							cursor: "pointer",
							accentColor: "#64ABDC",
							background: `linear-gradient(to right, #64ABDC 0%, #64ABDC ${(otherThreshold / 5) * 100}%, #64ABDC40 ${(otherThreshold / 5) * 100}%, #64ABDC40 100%)`
						}}
					/>
				</div>
			</div>

			{/* Legend Items - Fixed Container */}
			<div className="flex flex-col flex-1 min-h-0 gap-0">
				<h3 className="text-sm font-semibold mb-3 sticky top-0 bg-base-100" style={{ color: textColor }}>
					Taxonomies
				</h3>
				{/* Scrollable Content */}
				<div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2">
					{displayedItems.map((index) => {
						const percentage = total > 0 ? ((data[index] / total) * 100).toFixed(1) : "0.0";
						return (
							<div key={index} className="flex items-center gap-2.5 group">
								<div
									className="w-3.5 h-3.5 rounded-sm shrink-0 transition-transform group-hover:scale-110"
									style={{ backgroundColor: colors[index] }}
								/>
								<div className="flex-1 min-w-0 flex items-center gap-2">
									<Link
										href={`/explore/taxonomy/${encodeURIComponent(labels[index])}`}
										className="text-sm font-medium truncate transition-colors"
										style={{ color: textColor }}
										title={labels[index]}
									>
										{labels[index]}
									</Link>
									<span className="text-sm font-semibold whitespace-nowrap shrink-0" style={{ color: textColor, opacity: 0.6 }}>
										{percentage}%
									</span>
								</div>
							</div>
						);
					})}
				</div>

				{/* Other Group - Always at Bottom */}
				{otherCount > 0 && (
					<div className="flex items-center gap-2.5 pt-3 mt-3 border-t" style={{ borderColor: textColor + "15" }}>
						<div
							className="w-3.5 h-3.5 rounded-sm shrink-0"
							style={{ backgroundColor: textColor + "50" }}
						/>
						<div className="flex-1 min-w-0 flex items-center gap-2">
							<span className="text-sm font-medium" style={{ color: textColor }}>
								Other
							</span>
							<span className="text-sm font-semibold whitespace-nowrap shrink-0" style={{ color: textColor, opacity: 0.6 }}>
								{otherPercentage}%
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default function TaxonomyDonutChart({ labels, data, sampName }: TaxonomyDonutChartProps) {
	const { theme } = useTheme();
	const [otherThreshold, setOtherThreshold] = useState(0.5);
	const [isLoading, setIsLoading] = useState(true);
	const textColor = theme === "dark" ? "#E2E8F0" : "#2D3748";

	// Simulate chart loading - fade in after component mounts
	useEffect(() => {
		const timer = setTimeout(() => setIsLoading(false), 300);
		return () => clearTimeout(timer);
	}, []);

	const colors = generateDistinctColors(labels.length);

	// Filter data and labels based on threshold
	const { filteredLabels, filteredData, filteredColors, otherCount } = useMemo(() => {
		const total = data.reduce((sum, value) => sum + value, 0);
		const thresholdPercentage = otherThreshold;
		let otherSum = 0;
		const filtered: {
			labels: string[];
			data: number[];
			colors: string[];
			colorIndices: number[];
		} = {
			labels: [],
			data: [],
			colors: [],
			colorIndices: []
		};

		for (let i = 0; i < labels.length; i++) {
			const percentage = total > 0 ? (data[i] / total) * 100 : 0;
			if (percentage >= thresholdPercentage) {
				filtered.labels.push(labels[i]);
				filtered.data.push(data[i]);
				filtered.colors.push(colors[i]);
				filtered.colorIndices.push(i);
			} else {
				otherSum += data[i];
			}
		}

		// Add "Other" category if needed
		if (otherSum > 0) {
			filtered.labels.push("Other");
			filtered.data.push(otherSum);
			filtered.colors.push(textColor + "40");
		}

		return {
			filteredLabels: filtered.labels,
			filteredData: filtered.data,
			filteredColors: filtered.colors,
			otherCount: otherSum
		};
	}, [labels, data, colors, otherThreshold, textColor]);

	const chartData = {
		labels: filteredLabels,
		datasets: [
			{
				data: filteredData,
				backgroundColor: filteredColors,
				borderWidth: 2,
				borderColor: theme === "dark" ? "#1A202C" : "#FFFFFF",
				hoverOffset: 8,
				cutout: "65%"
			}
		]
	};

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false
			},
			tooltip: {
				backgroundColor: theme === "dark" ? "#2D3748" : "#FFFFFF",
				titleColor: textColor,
				bodyColor: textColor,
				borderColor: theme === "dark" ? "#4A5568" : "#E2E8F0",
				borderWidth: 1,
				zIndex: 1000,
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
			<div className="flex flex-col lg:flex-row items-start gap-8 min-h-[450px] bg-base-200 rounded-lg p-6 w-fit">
				{/* Chart Container with Loading State */}
				<div
					className={`relative h-[450px] w-[300px] shrink-0 mx-auto lg:mx-0 z-10 transition-opacity duration-300 ${
						isLoading ? "opacity-0" : "opacity-100"
					}`}
				>
					<Doughnut data={chartData} options={options} />
				</div>

				{/* Loading Spinner */}
				{isLoading && (
					<div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
						<div className="w-16 h-16 flex items-center justify-center">
							<span className="loading loading-spinner loading-lg" style={{ color: colors[0] || "#64ABDC" }} />
						</div>
					</div>
				)}

				{/* Custom Legend - Bounded Container */}
				<div className="flex-1 min-w-0 lg:min-w-[500px] lg:max-w-2xl h-[450px] rounded-lg p-4 bg-base-100">
					<CustomLegend
						labels={labels}
						data={data}
						colors={colors}
						textColor={textColor}
						sampName={sampName}
						otherThreshold={otherThreshold}
						setOtherThreshold={setOtherThreshold}
					/>
				</div>
			</div>
		</div>
	);
}

