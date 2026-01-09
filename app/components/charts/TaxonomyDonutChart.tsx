"use client";

import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useTheme } from "next-themes";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import distinctColors from "distinct-colors";

ChartJS.register(ArcElement, Tooltip);

interface TaxonomyDonutChartProps {
	labels: string[];
	data: number[];
	sampName: string;
}

function generateDistinctColors(count: number): string[] {
	const primaryBlue = "#64ABDC";

	if (count === 0) return [];
	if (count === 1) return [primaryBlue];

	const remainingCount = count - 1;

	const colors = distinctColors({
		count: remainingCount,
		hueMin: 0,
		hueMax: 360,
		lightMin: 30,
		lightMax: 80,
		chromaMin: 40,
		chromaMax: 90,
		quality: 100
	});

	const distinctHexColors = colors
		.map((color) => color.hex())
		.filter((color) => {
			const hexColor = color.toLowerCase();
			const primaryHex = primaryBlue.toLowerCase();

			const colorR = parseInt(hexColor.slice(1, 3), 16);
			const colorG = parseInt(hexColor.slice(3, 5), 16);
			const colorB = parseInt(hexColor.slice(5, 7), 16);

			const primaryR = parseInt(primaryHex.slice(1, 3), 16);
			const primaryG = parseInt(primaryHex.slice(3, 5), 16);
			const primaryB = parseInt(primaryHex.slice(5, 7), 16);

			const distance = Math.sqrt(
				Math.pow(colorR - primaryR, 2) + Math.pow(colorG - primaryG, 2) + Math.pow(colorB - primaryB, 2)
			);

			return distance > 60;
		});

	if (distinctHexColors.length < remainingCount) {
		const additionalColors = distinctColors({
			count: remainingCount - distinctHexColors.length + 5,
			hueMin: 0,
			hueMax: 360,
			lightMin: 25,
			lightMax: 85,
			chromaMin: 35,
			chromaMax: 95,
			quality: 150
		}).map((color) => color.hex());

		distinctHexColors.push(...additionalColors);
	}

	return [primaryBlue, ...distinctHexColors.slice(0, remainingCount)];
}

function generateColorsWithPrimaryAtIndex(count: number, primaryIndex: number): string[] {
	const primaryBlue = "#64ABDC";

	if (count === 0) return [];
	if (count === 1) return [primaryBlue];

	const baseColors = generateDistinctColors(count);

	if (primaryIndex === 0) return baseColors;

	const colors = [...baseColors.slice(1)];

	const result: string[] = new Array(count);
	result[primaryIndex] = primaryBlue;

	let cursor = 0;
	for (let i = 0; i < count; i++) {
		if (i === primaryIndex) continue;
		result[i] = colors[cursor++];
	}

	return result;
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
		<div className="flex flex-col gap-4 mt-0">
			{/* Threshold Control */}
			<div className="flex flex-col gap-2 pb-3 border-b" style={{ borderColor: textColor + "30" }}>
				<label className="text-sm font-medium" style={{ color: textColor }}>
					Group items below (%)
				</label>
				<div className="flex items-center gap-3">
					<input
						type="range"
						min="0"
						max="5"
						step="0.1"
						value={otherThreshold}
						onChange={(e) => setOtherThreshold(parseFloat(e.target.value))}
						className="flex-1"
						style={{
							cursor: "pointer",
							accentColor: colors[0] || "#64ABDC"
						}}
					/>
					<input
						type="number"
						min="0"
						max="5"
						step="0.1"
						value={otherThreshold}
						onChange={(e) => setOtherThreshold(parseFloat(e.target.value) || 0)}
						className="w-16 px-2 py-1 text-sm rounded border"
						style={{
							borderColor: textColor + "30",
							color: textColor,
							backgroundColor: textColor + "05"
						}}
					/>
				</div>
			</div>

		{/* Legend Items */}
		<div className="flex flex-col gap-3 lg:max-h-[400px] lg:overflow-y-auto pr-2">
				<h3 className="text-lg font-semibold" style={{ color: textColor }}>
					Taxonomies
				</h3>
				{displayedItems.map((index) => {
					const percentage = total > 0 ? ((data[index] / total) * 100).toFixed(1) : "0.0";
					return (
						<div key={index} className="flex items-center gap-3">
							<div
								className="w-4 h-4 rounded-sm flex-shrink-0"
								style={{ backgroundColor: colors[index] }}
							/>
							<div className="flex-1 min-w-0 flex items-center gap-1">
								<Link
									href={`/search?table=taxonomy&query=${encodeURIComponent(labels[index])}`}
									className="text-sm font-medium truncate hover:text-primary hover:underline transition-colors"
									style={{ color: textColor }}
									title={labels[index]}
								>
									{labels[index]}
								</Link>
								<span className="text-sm font-semibold whitespace-nowrap" style={{ color: textColor, opacity: 0.75 }}>
									{percentage}%
								</span>
							</div>
						</div>
					);
				})}

				{/* Other Group */}
				{otherCount > 0 && (
					<div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: textColor + "30" }}>
						<div
							className="w-4 h-4 rounded-sm flex-shrink-0"
							style={{ backgroundColor: textColor + "40" }}
						/>
						<div className="flex-1 min-w-0 flex items-center gap-1">
							<span className="text-sm font-medium" style={{ color: textColor }}>
								Other
							</span>
							<span className="text-sm font-semibold whitespace-nowrap" style={{ color: textColor, opacity: 0.75 }}>
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

	const maxIndex = data.reduce((bestIndex, value, i, arr) => (value > arr[bestIndex] ? i : bestIndex), 0);
	const colors = generateColorsWithPrimaryAtIndex(labels.length, maxIndex);

	// Filter data and labels based on threshold
	const { filteredLabels, filteredData, filteredColors, otherCount } = useMemo(() => {
		const total = data.reduce((sum, value) => sum + value, 0);
		const thresholdPercentage = otherThreshold;
		let otherSum = 0;
		const filtered = {
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
			<div className="flex flex-col lg:flex-row items-start gap-8 min-h-[450px]">
				{/* Chart Container with Loading State */}
				<div
					className={`relative h-[450px] w-[300px] flex-shrink-0 mx-auto lg:mx-0 z-0 transition-opacity duration-300 ${
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

				{/* Custom Legend - Much Wider */}
				<div className="flex-1 min-w-0 lg:min-w-[500px] lg:max-w-2xl">
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

