"use client";

import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useTheme } from "next-themes";
import { useState, useMemo, useEffect, useRef } from "react";
import { useThrottledCallback } from "use-debounce";
import Link from "next/link";
import distinctColors from "distinct-colors";

ChartJS.register(ArcElement, Tooltip);

interface TaxonomyRecord {
	taxonomy: string;
	domain: string | null;
	kingdom: string | null;
	supergroup: string | null;
	division: string | null;
	subdivision: string | null;
	phylum: string | null;
	class: string | null;
	order: string | null;
	family: string | null;
	genus: string | null;
	species: string | null;
}

// Derived from TaxonomyRecord keys
type TaxRankField = Exclude<keyof TaxonomyRecord, "taxonomy">;

interface TaxonomyDonutChartProps {
	taxonomies: TaxonomyRecord[];
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
	setOtherThreshold,
	taxLevel,
	setTaxLevel,
	taxLevels
}: {
	labels: string[];
	data: number[];
	colors: string[];
	textColor: string;
	sampName: string;
	otherThreshold: number;
	setOtherThreshold: (value: number) => void;
	taxLevel: TaxRankField;
	setTaxLevel: (level: TaxRankField) => void;
	taxLevels: TaxRankField[];
}) {
	const total = data.reduce((sum, value) => sum + value, 0);

	// Local string state for the text box so we can show "1.0" for whole numbers
	// without the browser stripping the trailing zero (which type="number" always does)
	const [inputValue, setInputValue] = useState(() => otherThreshold.toFixed(1));
	const inputFocused = useRef(false);

	// When the slider moves, sync the text box — but only if the user isn't typing in it
	useEffect(() => {
		if (!inputFocused.current) {
			setInputValue(Number.isInteger(otherThreshold) ? otherThreshold.toFixed(1) : String(otherThreshold));
		}
	}, [otherThreshold]);

	// Throttle fires at regular intervals while dragging, giving immediate feedback
	const throttledSetOtherThreshold = useThrottledCallback((value: number) => {
		setOtherThreshold(value);
	}, 100);

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
			{/* Taxonomic Level Dropdown */}
			<div className="flex flex-col gap-1.5">
				<label className="text-xs uppercase font-semibold tracking-wide" style={{ color: textColor + "99" }}>
					Taxonomic Level
				</label>
				<div className="dropdown w-full">
					<div
						tabIndex={0}
						role="button"
						className="flex items-center justify-between w-full px-3 py-2 rounded border cursor-pointer bg-base-200 border-base-300"
						style={{ color: textColor }}
					>
						<span className="text-base font-medium">
							{taxLevel.charAt(0).toUpperCase() + taxLevel.slice(1)}
						</span>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
					</div>
					<ul tabIndex={0} className="dropdown-content menu bg-base-300 rounded-box z-50 w-full shadow-lg p-1 mt-1">
						{taxLevels.map((level) => (
							<li key={level}>
								<button
									className={`text-base w-full text-left px-3 py-1.5 rounded ${taxLevel === level ? "font-semibold text-primary" : ""}`}
									onClick={() => { setTaxLevel(level); (document.activeElement as HTMLElement)?.blur(); }}
								>
									{level.charAt(0).toUpperCase() + level.slice(1)}
								</button>
							</li>
						))}
					</ul>
				</div>
			</div>

			{/* Threshold Control */}
			<div className="flex flex-col gap-3 pb-3" style={{ borderColor: textColor + "20" }}>
				<label className="text-xs uppercase font-semibold tracking-wide" style={{ color: textColor + "99" }}>
					Group items below (%)
				</label>
				<div className="flex items-center gap-3">
					<input
						type="text"
						inputMode="decimal"
						value={inputValue}
						onFocus={() => { inputFocused.current = true; }}
						onBlur={() => {
							inputFocused.current = false;
							// On blur, reformat: add .0 if the value is a whole number
							const parsed = parseFloat(inputValue);
							const clamped = isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
							setOtherThreshold(clamped);
							setInputValue(Number.isInteger(clamped) ? clamped.toFixed(1) : String(clamped));
						}}
						onChange={(e) => {
							setInputValue(e.target.value);
							const parsed = parseFloat(e.target.value);
							if (!isNaN(parsed)) {
								setOtherThreshold(Math.min(100, Math.max(0, parsed)));
							}
						}}
						className="w-16 px-2 py-1.5 text-sm rounded border transition-colors"
						style={{
							borderColor: textColor + "30",
							color: textColor,
							backgroundColor: "transparent"
						}}
					/>
					<input
						type="range"
						min="0"
						max="100"
						step="1"
						value={otherThreshold}
						onChange={(e) => throttledSetOtherThreshold(parseFloat(e.target.value))}
						className="flex-1 h-2 rounded-lg appearance-none"
						style={{
							cursor: "pointer",
							accentColor: "#64ABDC",
							background: `linear-gradient(to right, #64ABDC 0%, #64ABDC ${otherThreshold}%, #64ABDC40 ${otherThreshold}%, #64ABDC40 100%)`
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
									<span
										className="text-sm font-semibold whitespace-nowrap shrink-0"
										style={{ color: textColor, opacity: 0.6 }}
									>
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
						<div className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ backgroundColor: textColor + "50" }} />
						<div className="flex-1 min-w-0 flex items-center gap-2">
							<span className="text-sm font-medium" style={{ color: textColor }}>
								Other
							</span>
							<span
								className="text-sm font-semibold whitespace-nowrap shrink-0"
								style={{ color: textColor, opacity: 0.6 }}
							>
								{otherPercentage}%
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default function TaxonomyDonutChart({ taxonomies, sampName }: TaxonomyDonutChartProps) {
	const { theme } = useTheme();
	const [otherThreshold, setOtherThreshold] = useState(0.5);
	const [taxLevel, setTaxLevel] = useState<TaxRankField>("family");
	const [isLoading, setIsLoading] = useState(true);
	const textColor = theme === "dark" ? "#E2E8F0" : "#2D3748";

	// Derive available rank levels from the actual record keys - no hardcoded list
	const taxLevels = useMemo<TaxRankField[]>(() => {
		if (!taxonomies.length) return [];
		return Object.keys(taxonomies[0]).filter((k) => k !== "taxonomy") as TaxRankField[];
	}, [taxonomies]);

	// Simulate chart loading - fade in after component mounts
	useEffect(() => {
		const timer = setTimeout(() => setIsLoading(false), 300);
		return () => clearTimeout(timer);
	}, []);

	// Group taxonomy records by the selected level, count occurrences per group
	const { labels, data } = useMemo(() => {
		const counts = new Map<string, number>();
		for (const taxa of taxonomies) {
			const key = taxa[taxLevel] ?? "Unknown";
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		const sorted = Array.from(counts.entries())
			.map(([label, count]) => ({ label, count }))
			.sort((a, b) => b.count - a.count);
		return {
			labels: sorted.map((t) => t.label),
			data: sorted.map((t) => t.count)
		};
	}, [taxonomies, taxLevel]);

	const colors = generateDistinctColors(labels.length);

	// Filter data and labels based on threshold
	const { filteredLabels, filteredData, filteredColors } = useMemo(() => {
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
						taxLevel={taxLevel}
						setTaxLevel={setTaxLevel}
						taxLevels={taxLevels}
					/>
				</div>
			</div>
		</div>
	);
}
