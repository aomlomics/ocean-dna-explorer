"use client";

import { useMemo, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Title } from "chart.js";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import ChartCopyButton from "./ChartCopyButton";
import TaxonomySunburst from "./TaxonomySunburst";
import TaxonomyLollipopChart from "./TaxonomyLollipopChart";
import { TaxonomicRanks } from "@/types/objects";
import { OccsByFeatureid, TaxaAssignment, TaxonomiesById, Rank, aggregateByRank } from "./taxaAggregation";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Title);

const TOP_N = 25;
type View = "bar" | "lollipop" | "sunburst";

function CompositionBarChart({
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

	const chartData = useMemo(() => {
		const { totals, grandTotal } = aggregateByRank(occsByFeatureid, assignments, taxonomiesById, rank);
		const sorted = Array.from(totals.entries())
			.map(([label, value]) => ({ label, percent: grandTotal > 0 ? (value / grandTotal) * 100 : 0 }))
			.sort((a, b) => b.percent - a.percent)
			.slice(0, TOP_N);

		return {
			labels: sorted.map((s) => s.label),
			datasets: [
				{
					label: "Relative Abundance (%)",
					data: sorted.map((s) => s.percent),
					backgroundColor: "#64ABDC"
				}
			]
		};
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

			<Bar
				ref={ref}
				data={chartData}
				options={{
					responsive: true,
					animation: false,
					plugins: {
						title: { display: true, text: `Composition by ${rank} (top ${TOP_N})`, color: textColor },
						legend: { display: false }
					},
					scales: {
						x: { ticks: { color: textColor, autoSkip: false, maxRotation: 60, minRotation: 30 } },
						y: {
							beginAtZero: true,
							title: { display: true, text: "Relative Abundance (%)", color: textColor },
							ticks: { color: textColor }
						}
					}
				}}
			/>
		</div>
	);
}

export default function CompositionExplorer({
	occsByFeatureid,
	assignments,
	taxonomiesById
}: {
	occsByFeatureid: OccsByFeatureid;
	assignments: TaxaAssignment[];
	taxonomiesById: TaxonomiesById;
}) {
	const [view, setView] = useState<View>("bar");
	const [parentRank, setParentRank] = useState<Rank>("phylum");
	const [childRank, setChildRank] = useState<Rank>("family");

	return (
		<div>
			<div className="w-full flex justify-center gap-2 pt-2">
				{(["bar", "lollipop", "sunburst"] as View[]).map((v) => (
					<button key={v} className={`btn ${view === v ? "btn-primary" : ""}`} onClick={() => setView(v)}>
						{v.charAt(0).toUpperCase() + v.slice(1)}
					</button>
				))}
			</div>

			{view === "bar" && (
				<CompositionBarChart occsByFeatureid={occsByFeatureid} assignments={assignments} taxonomiesById={taxonomiesById} />
			)}

			{view === "lollipop" && (
				<TaxonomyLollipopChart
					occsByFeatureid={occsByFeatureid}
					assignments={assignments}
					taxonomiesById={taxonomiesById}
				/>
			)}

			{view === "sunburst" && (
				<div>
					<div className="w-full flex justify-center items-end gap-5 mb-4">
						<fieldset className="fieldset">
							<legend className="fieldset-legend">Inner ring:</legend>
							<select value={parentRank} onChange={(e) => setParentRank(e.target.value as Rank)} className="select">
								{TaxonomicRanks.slice(0, -1).map((r) => (
									<option key={r}>{r}</option>
								))}
							</select>
						</fieldset>
						<fieldset className="fieldset">
							<legend className="fieldset-legend">Outer ring:</legend>
							<select value={childRank} onChange={(e) => setChildRank(e.target.value as Rank)} className="select">
								{TaxonomicRanks.slice(TaxonomicRanks.indexOf(parentRank) + 1).map((r) => (
									<option key={r}>{r}</option>
								))}
							</select>
						</fieldset>
					</div>
					<TaxonomySunburst
						occsByFeatureid={occsByFeatureid}
						assignments={assignments}
						taxonomiesById={taxonomiesById}
						parentRank={parentRank}
						childRank={childRank}
					/>
				</div>
			)}
		</div>
	);
}
