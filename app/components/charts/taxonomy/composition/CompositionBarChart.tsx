"use client";

import { useMemo, useRef, useState } from "react";
import {
	COMPOSITION_BAR_DEFAULT_RANK,
	type AssignsByFeatureid,
	type TaxonomiesByName
} from "../../wrappers/TaxonomyVisualize";
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Title, Tooltip } from "chart.js";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import chroma from "chroma-js";
import type { TaxonomicRank } from "@/types/globals";
import { TaxonomicRanks } from "@/types/objects";
import ChartCopyButton from "../../ChartCopyButton";
import { Bar } from "react-chartjs-2";
import { aggregateByRank, TOP_N } from "./helpers";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Title);

export default function CompositionBarChart({
	assignsByFeatureid,
	taxonomiesByName
}: {
	assignsByFeatureid: AssignsByFeatureid;
	taxonomiesByName: TaxonomiesByName;
}) {
	const ref = useRef<ChartJS<"bar">>(null);
	const { textColor, primaryColor } = useDaisyTheme();
	const gridColor = chroma(textColor).alpha(0.3).hex();

	const [rank, setRank] = useState(COMPOSITION_BAR_DEFAULT_RANK);

	const chartData = useMemo(() => {
		const { totals, grandTotal } = aggregateByRank(assignsByFeatureid, taxonomiesByName, rank);

		const sorted = Array.from(totals.entries())
			.map(([label, value]) => ({
				label,
				percent: grandTotal > 0 ? (value / grandTotal) * 100 : 0
			}))
			.sort((a, b) => b.percent - a.percent)
			.slice(0, TOP_N);

		return {
			labels: sorted.map((s) => s.label),
			datasets: [
				{
					label: "Relative Abundance (%)",
					data: sorted.map((s) => s.percent),
					backgroundColor: primaryColor
				}
			]
		};
	}, [assignsByFeatureid, taxonomiesByName, rank, primaryColor]);

	return (
		<div className="relative p-6">
			<div className="w-full flex justify-center items-center gap-5 mb-4">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Taxonomic Rank:</legend>

					<select value={rank} onChange={(e) => setRank(e.target.value as TaxonomicRank)} className="select">
						{TaxonomicRanks.map((r) => (
							<option key={r}>{r}</option>
						))}
					</select>
				</fieldset>

				<ChartCopyButton ref={ref} />
			</div>

			<Bar
				ref={ref}
				data={chartData}
				options={{
					responsive: true,
					animation: false,
					plugins: {
						title: {
							display: true,
							text: `Composition by ${rank} (top ${TOP_N})`,
							color: textColor
						},
						legend: {
							display: false
						}
					},
					scales: {
						x: {
							ticks: {
								color: textColor,
								autoSkip: false,
								maxRotation: 60,
								minRotation: 30
							},
							grid: {
								color: gridColor
							}
						},
						y: {
							beginAtZero: true,
							title: {
								display: true,
								text: "Relative Abundance (%)",
								color: textColor
							},
							ticks: {
								color: textColor
							},
							grid: {
								color: gridColor
							}
						}
					}
				}}
			/>
		</div>
	);
}
