"use client";

import { useMemo, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from "chart.js";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import ChartCopyButton from "./ChartCopyButton";
import { Library, Sample } from "@/app/generated/prisma/client";
import { TaxonomicRanks } from "@/types/objects";
import { OccsByFeatureid, TaxaAssignment, TaxonomiesById, Rank, sampleSetsByRank } from "./taxaAggregation";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

export default function TaxaPrevalenceHistogram({
	occsByFeatureid,
	assignments,
	taxonomiesById,
	sampleIdsByLibId
}: {
	occsByFeatureid: OccsByFeatureid;
	assignments: TaxaAssignment[];
	taxonomiesById: TaxonomiesById;
	sampleIdsByLibId: Record<Library["lib_id"], Sample["id"]>;
}) {
	const ref = useRef<ChartJS<"bar">>(null);
	const { textColor } = useDaisyTheme();
	const [rank, setRank] = useState<Rank>("species");

	const chartData = useMemo(() => {
		const sets = sampleSetsByRank(occsByFeatureid, assignments, taxonomiesById, sampleIdsByLibId, rank);

		// bin: number of samples detected in -> number of taxa with that count
		const bins = new Map<number, number>();
		let maxSamples = 0;
		for (const [, sampleSet] of sets) {
			const count = sampleSet.size;
			if (count === 0) continue;
			bins.set(count, (bins.get(count) ?? 0) + 1);
			maxSamples = Math.max(maxSamples, count);
		}

		const labels = Array.from({ length: maxSamples }, (_, i) => i + 1);

		return {
			labels: labels.map(String),
			datasets: [
				{
					label: "Number of taxa",
					data: labels.map((n) => bins.get(n) ?? 0),
					backgroundColor: "#64ABDC",
					borderColor: "#64ABDC",
					borderWidth: 1
				}
			]
		};
	}, [occsByFeatureid, assignments, taxonomiesById, sampleIdsByLibId, rank]);

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
						title: { display: true, text: `How many samples is each ${rank} detected in?`, color: textColor },
						legend: { display: false }
					},
					scales: {
						x: {
							title: { display: true, text: "Number of samples detected in", color: textColor },
							ticks: { color: textColor }
						},
						y: {
							beginAtZero: true,
							title: { display: true, text: "Number of taxa", color: textColor },
							ticks: { color: textColor, precision: 0 }
						}
					}
				}}
			/>
		</div>
	);
}
