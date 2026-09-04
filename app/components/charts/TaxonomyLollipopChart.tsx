"use client";

import { useMemo, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Title, Plugin } from "chart.js";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import ChartCopyButton from "./ChartCopyButton";
import { TaxonomicRanks } from "@/types/objects";
import { OccsByFeatureid, TaxaAssignment, TaxonomiesById, Rank, aggregateByRank } from "./taxaAggregation";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Title);

const TOP_N = 25;
const CAP_COLOR = "#08306b";

// Draws a circular "lollipop" cap at the tip of each thin bar, avoiding the need to
// mix a bar + scatter dataset (which gets fiddly once one axis is a category scale).
const lollipopCapsPlugin: Plugin<"bar"> = {
	id: "lollipopCaps",
	afterDatasetsDraw(chart) {
		const { ctx } = chart;
		const meta = chart.getDatasetMeta(0);

		meta.data.forEach((bar: any) => {
			ctx.save();
			ctx.fillStyle = CAP_COLOR;
			ctx.beginPath();
			ctx.arc(bar.x, bar.y, 5, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		});
	}
};

export default function TaxonomyLollipopChart({
	occsByFeatureid,
	assignments,
	taxonomiesById
}: {
	occsByFeatureid: OccsByFeatureid;
	assignments: TaxaAssignment[];
	taxonomiesById: TaxonomiesById;
}) {
	const ref = useRef<ChartJS<"bar">>(null);
	const { textColor } = useDaisyTheme();
	const [rank, setRank] = useState<Rank>("family");

	const { labels, percents } = useMemo(() => {
		const { totals, grandTotal } = aggregateByRank(occsByFeatureid, assignments, taxonomiesById, rank);

		const sorted = Array.from(totals.entries())
			.map(([label, value]) => ({ label, percent: grandTotal > 0 ? (value / grandTotal) * 100 : 0 }))
			.sort((a, b) => b.percent - a.percent)
			.slice(0, TOP_N);

		return { labels: sorted.map((s) => s.label), percents: sorted.map((s) => s.percent) };
	}, [occsByFeatureid, assignments, taxonomiesById, rank]);

	return (
		<div className="relative p-6">
			<div className="w-full flex justify-center items-end gap-5 mb-4">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Taxonomic Rank:</legend>
					<select value={rank} onChange={(e) => setRank(e.target.value as Rank)} className="select">
						{TaxonomicRanks.map((r) => (
							<option key={r}>{r}</option>
						))}
					</select>
				</fieldset>

				<ChartCopyButton ref={ref} />
			</div>

			<div style={{ height: Math.max(400, labels.length * 26) }}>
				<Bar
					ref={ref}
					data={{
						labels,
						datasets: [
							{
								label: "Relative Abundance (%)",
								data: percents,
								backgroundColor: textColor + "40",
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
							title: { display: true, text: `Composition by ${rank} (top ${TOP_N})`, color: textColor },
							legend: { display: false },
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
								title: { display: true, text: "Relative Abundance (%)", color: textColor },
								ticks: { color: textColor }
							},
							y: { ticks: { color: textColor }, title: { display: true, text: rank, color: textColor } }
						}
					}}
					plugins={[lollipopCapsPlugin]}
				/>
			</div>
		</div>
	);
}
