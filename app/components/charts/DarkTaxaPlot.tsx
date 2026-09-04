"use client";

import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Tooltip, Filler } from "chart.js";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import TaxonomySunburst from "./TaxonomySunburst";
import { Library, Sample, Taxonomy } from "@/app/generated/prisma/client";
import { TaxonomicRanks } from "@/types/objects";
import { OccsByFeatureid, TaxaAssignment, TaxonomiesById, Rank, perTaxonomyStats } from "./taxaAggregation";
import { gaussianKDE } from "@/app/helpers/kde";

ChartJS.register(LineElement, PointElement, LinearScale, Tooltip, Filler);

const DEFAULT_THRESHOLD = 90; // % identity below which a match is considered "dark"
const MAX_ROWS = 50; // rendering one Line chart per row - keep this bounded

function KDESparkline({ values, color }: { values: number[]; color: string }) {
	if (values.length < 2) {
		return <span className="text-xs opacity-60">n={values.length}</span>;
	}

	const { x, y } = gaussianKDE(values);

	return (
		<div style={{ width: 140, height: 36 }}>
			<Line
				data={{
					labels: x.map((v) => v.toFixed(1)),
					datasets: [
						{
							data: y,
							borderColor: color,
							backgroundColor: color + "30",
							fill: true,
							pointRadius: 0,
							borderWidth: 1.5,
							tension: 0.3
						}
					]
				}}
				options={{
					responsive: true,
					maintainAspectRatio: false,
					animation: false,
					plugins: {
						legend: { display: false },
						tooltip: {
							callbacks: {
								title(ctx) {
									return `${ctx[0].label}% identity`;
								},
								label() {
									return "";
								}
							}
						}
					},
					scales: {
						x: { display: false },
						y: { display: false, beginAtZero: true }
					}
				}}
			/>
		</div>
	);
}

export default function DarkTaxaPlot({
	occsByFeatureid,
	assignments,
	taxonomiesById,
	taxonomyStrings,
	sampleIdsByLibId
}: {
	occsByFeatureid: OccsByFeatureid;
	assignments: TaxaAssignment[];
	taxonomiesById: TaxonomiesById;
	taxonomyStrings: Record<Taxonomy["id"], Taxonomy["taxonomy"]>;
	sampleIdsByLibId: Record<Library["lib_id"], Sample["id"]>;
}) {
	const { textColor } = useDaisyTheme();
	const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
	const [parentRank, setParentRank] = useState<Rank>("kingdom");
	const [childRank, setChildRank] = useState<Rank>("phylum");

	// an assignment with no percent_id at all is treated as "dark" too - no confidence
	// data means no confident match either
	const darkAssignments = useMemo(
		() => assignments.filter((a) => a.percent_id == null || a.percent_id < threshold),
		[assignments, threshold]
	);

	const stats = useMemo(
		() => perTaxonomyStats(occsByFeatureid, darkAssignments, sampleIdsByLibId),
		[occsByFeatureid, darkAssignments, sampleIdsByLibId]
	);

	// relative abundance % is computed against the WHOLE community (all assignments),
	// so it shows how much of the total community these dark taxa represent
	const grandTotal = useMemo(() => {
		let total = 0;
		for (const assign of assignments) {
			const occs = occsByFeatureid[assign.featureid];
			if (!occs) continue;
			for (const occ of occs) total += occ.organismQuantity;
		}
		return total;
	}, [occsByFeatureid, assignments]);

	const rows = useMemo(
		() =>
			Array.from(stats.entries())
				.map(([taxonomyId, s]) => ({
					taxonomyId,
					taxonomy: taxonomyStrings[taxonomyId] ?? String(taxonomyId),
					features: s.features.size,
					samples: s.samples.size,
					percent: grandTotal > 0 ? (s.quantity / grandTotal) * 100 : 0,
					percentIds: s.percentIds
				}))
				.sort((a, b) => b.percent - a.percent)
				.slice(0, MAX_ROWS),
		[stats, taxonomyStrings, grandTotal]
	);

	return (
		<div className="p-6">
			<div className="w-full flex justify-center items-end gap-5 mb-4">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Dark taxa threshold (% identity below):</legend>
					<input
						type="number"
						min={0}
						max={100}
						value={threshold}
						onChange={(e) => setThreshold(Number(e.target.value))}
						className="input w-24"
					/>
				</fieldset>
			</div>

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
				assignments={darkAssignments}
				taxonomiesById={taxonomiesById}
				parentRank={parentRank}
				childRank={childRank}
				title={`Dark taxa (< ${threshold}% identity): ${parentRank} > ${childRank}`}
			/>

			{rows.length === MAX_ROWS && (
				<p className="text-center text-sm opacity-70 mb-2">
					Showing the top {MAX_ROWS} dark taxa by relative abundance.
				</p>
			)}

			<div className="overflow-x-auto mt-6">
				<table className="table">
					<thead>
						<tr>
							<th>Taxonomy</th>
							<th># Features</th>
							<th># Samples</th>
							<th>Relative Abundance</th>
							<th>% Identity Distribution</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((r) => (
							<tr key={r.taxonomyId}>
								<td className="max-w-75 truncate" title={r.taxonomy}>
									{r.taxonomy}
								</td>
								<td>{r.features}</td>
								<td>{r.samples}</td>
								<td>{r.percent.toFixed(2)}%</td>
								<td>
									<KDESparkline values={r.percentIds} color={textColor} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
