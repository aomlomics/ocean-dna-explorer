"use client";

import { useMemo, useRef, useState } from "react";
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Title, Tooltip, type Plugin } from "chart.js";
import {
	COMPOSITION_LOLLIPOP_DEFAULT_RANK,
	type AssignsByFeatureid,
	type TaxonomiesByName
} from "../../wrappers/TaxonomyVisualize";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import chroma from "chroma-js";
import type { TaxonomicRank } from "@/types/globals";
import { aggregateByRank, TOP_N } from "./helpers";
import ChartCopyButton from "../../ChartCopyButton";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Title);

export default function TaxonomyLollipopChart({
	assignsByFeatureid,
	taxonomiesByName,
	taxaRanksWithData
}: {
	assignsByFeatureid: AssignsByFeatureid;
	taxonomiesByName: TaxonomiesByName;
	taxaRanksWithData: TaxonomicRank[];
}) {
	const ref = useRef<ChartJS<"bar">>(null);
	const { textColor, primaryColor } = useDaisyTheme();
	const gridColor = chroma(textColor).alpha(0.3).hex();

	const [rank, setRank] = useState(COMPOSITION_LOLLIPOP_DEFAULT_RANK);

	const { labels, percents } = useMemo(() => {
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
			percents: sorted.map((s) => s.percent)
		};
	}, [assignsByFeatureid, taxonomiesByName, rank]);

	const lollipopCapsPlugin = {
		id: "lollipopCaps",

		afterDatasetsDraw(chart) {
			const { ctx } = chart;
			const meta = chart.getDatasetMeta(0);

			meta.data.forEach((bar) => {
				ctx.save();
				ctx.fillStyle = primaryColor;
				ctx.beginPath();
				ctx.arc(bar.x, bar.y, 5, 0, Math.PI * 2);
				ctx.fill();
				ctx.restore();
			});
		}
	} as Plugin<"bar">;

	return (
		<div className="relative p-6">
			<div className="w-full flex justify-center items-center gap-5 mb-4">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Taxonomic Rank:</legend>

					<select value={rank} onChange={(e) => setRank(e.target.value as TaxonomicRank)} className="select">
						{taxaRanksWithData.map((r) => (
							<option key={r}>{r}</option>
						))}
					</select>
				</fieldset>

				<ChartCopyButton ref={ref} />
			</div>

			<div style={{ height: Math.max(400, labels.length * 26) }}>
				<Bar
					key={primaryColor}
					ref={ref}
					data={{
						labels,
						datasets: [
							{
								label: "Relative Abundance (%)",
								data: percents,
								backgroundColor: chroma(textColor).alpha(0.4).hex(),
								barThickness: 2,
								categoryPercentage: 0.9
							}
						]
					}}
					options={{
						indexAxis: "y" as const,
						responsive: true,
						maintainAspectRatio: false,
						animation: false,

						plugins: {
							title: {
								display: true,
								text: `Composition by ${rank} (top ${TOP_N})`,
								color: textColor
							},

							legend: {
								display: false
							},

							tooltip: {
								callbacks: {
									label(ctx) {
										return `${(ctx.parsed.x as number).toFixed(2)}%`;
									}
								}
							}
						},

						scales: {
							x: {
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
							},
							y: {
								ticks: {
									color: textColor
								},
								title: {
									display: true,
									text: rank,
									color: textColor
								},
								grid: {
									color: gridColor
								}
							}
						}
					}}
					plugins={[lollipopCapsPlugin]}
				/>
			</div>
		</div>
	);
}
