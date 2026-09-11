"use client";

import { useMemo, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Tooltip, Filler } from "chart.js";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import { type AssignmentModel, type OccurrenceModel, type SampleModel } from "@/app/generated/prisma/models";
import { TaxonomicRanks } from "@/types/objects";
import {
	DARK_TAXA_DEFAULT_INNER_RANK,
	DARK_TAXA_DEFAULT_OUTER_RANK,
	DARK_TAXA_DEFAULT_THRESHOLD,
	type AssignsByFeatureid,
	type LibsWithSampleById,
	type TaxonomiesByName
} from "../wrappers/TaxonomyVisualize";
import type { TaxonomicRank } from "@/types/globals";
import TaxonomySunburst from "../custom/TaxonomySunburst";
import Link from "next/link";
import { exploreUrl } from "@/types/tableMetadata";
import ChartCopyButton from "../ChartCopyButton";

ChartJS.register(LineElement, PointElement, LinearScale, Tooltip, Filler);

const MAX_ROWS = 50; // rendering one Line chart per row - keep this bounded
const GRID_POINTS = 40;

function KDESparkline({ values, color }: { values: number[]; color: string }) {
	if (values.length < 2) {
		return <span className="text-xs opacity-60">n={values.length}</span>;
	}

	const x = [] as number[];
	const y = [] as number[];

	if (values.length) {
		//gaussian KDE
		const n = values.length;
		const mean = values.reduce((a, b) => a + b, 0) / n;
		const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(n - 1, 1);
		const stdev = Math.sqrt(variance) || 1;

		// Silverman's rule of thumb
		const bandwidth = 1.06 * stdev * Math.pow(n, -1 / 5) || 1;

		const min = Math.min(...values);
		const max = Math.max(...values);
		const padding = (max - min) * 0.1 || 1;
		const gridMin = min - padding;
		const gridMax = max + padding;
		const step = (gridMax - gridMin) / (GRID_POINTS - 1);

		for (let i = 0; i < GRID_POINTS; i++) {
			const xi = gridMin + i * step;
			let density = 0;
			for (const v of values) {
				const u = (xi - v) / bandwidth;
				density += Math.exp(-0.5 * u * u);
			}
			density /= n * bandwidth * Math.sqrt(2 * Math.PI);

			x.push(xi);
			y.push(density);
		}
	}

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
									return `${ctx[0]!.label}% identity`;
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
	assignsByFeatureid,
	taxonomiesByName,
	libsWithSampleById,
	totalOrganismQuantity
}: {
	assignsByFeatureid: AssignsByFeatureid;
	taxonomiesByName: TaxonomiesByName;
	libsWithSampleById: LibsWithSampleById;
	totalOrganismQuantity: number;
}) {
	const { textColor } = useDaisyTheme();
	const chartRef = useRef<ChartJS<"doughnut">>(null);

	const [threshold, setThreshold] = useState(DARK_TAXA_DEFAULT_THRESHOLD);
	const [parentRank, setParentRank] = useState(DARK_TAXA_DEFAULT_INNER_RANK);
	const [childRank, setChildRank] = useState(DARK_TAXA_DEFAULT_OUTER_RANK);

	const darkAssignments = useMemo(
		() =>
			Object.values(assignsByFeatureid).filter((assign) => assign.percent_id == null || assign.percent_id < threshold),
		[assignsByFeatureid, threshold]
	);

	const rows = useMemo(() => {
		const stats = new Map() as Map<
			string,
			{
				features: Set<AssignmentModel["featureid"]>;
				samples: Set<SampleModel["id"]>;
				quantity: OccurrenceModel["organismQuantity"];
				percentIds: NonNullable<AssignmentModel["percent_id"]>[];
			}
		>;

		for (const assign of darkAssignments) {
			const taxonomy = assign.taxonomy;

			let entry = stats.get(taxonomy);
			if (!entry) {
				entry = {
					features: new Set(),
					samples: new Set(),
					quantity: 0,
					percentIds: []
				};

				stats.set(taxonomy, entry);
			}

			entry.features.add(assign.featureid);

			if (assign.percent_id != null) {
				entry.percentIds.push(assign.percent_id);
			}

			for (const occ of assign.Occurrences) {
				if (occ.organismQuantity) {
					entry.samples.add(libsWithSampleById.get(occ.Library.id)!.Sample.id);
					entry.quantity += occ.organismQuantity;
				}
			}
		}

		return Array.from(stats.entries())
			.map(([taxonomy, stat]) => ({
				taxonomy,
				features: stat.features.size,
				samples: stat.samples.size,
				percent: totalOrganismQuantity > 0 ? (stat.quantity / totalOrganismQuantity) * 100 : 0,
				percentIds: stat.percentIds
			}))
			.sort((a, b) => b.percent - a.percent)
			.slice(0, MAX_ROWS);
	}, [darkAssignments]);

	return (
		<div className="p-6 flex flex-col items-center gap-5">
			<div className="flex justify-center items-center gap-5">
				<fieldset className="fieldset w-80">
					<legend className="fieldset-legend">
						Dark taxa threshold:
						<label className="input input-sm px-2 w-15">
							<input
								type="number"
								min={0}
								max={100}
								step={1}
								value={threshold}
								onChange={(e) => setThreshold(Number(e.target.value))}
							/>
						</label>
					</legend>

					<input
						type="range"
						min="0"
						max="100"
						step="1"
						value={threshold}
						onChange={(e) => setThreshold(Number(e.target.value))}
						className="range"
					/>

					<div className="flex justify-between px-2.5 text-xs">
						<span>0%</span>
						<span>25%</span>
						<span>50%</span>
						<span>75%</span>
						<span>100%</span>
					</div>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Inner ring:</legend>
					<select
						value={parentRank}
						onChange={(e) => {
							const newParent = e.target.value as TaxonomicRank;
							setParentRank(newParent);

							if (TaxonomicRanks.indexOf(newParent) >= TaxonomicRanks.indexOf(childRank)) {
								setChildRank(TaxonomicRanks[TaxonomicRanks.indexOf(newParent) + 1] ?? newParent);
							}
						}}

						className="select"
					>
						{TaxonomicRanks.slice(0, -1).map((r) => (
							<option key={r}>{r}</option>
						))}
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Outer ring:</legend>
					<select value={childRank} onChange={(e) => setChildRank(e.target.value as TaxonomicRank)} className="select">
						{TaxonomicRanks.slice(TaxonomicRanks.indexOf(parentRank) + 1).map((r) => (
							<option key={r}>{r}</option>
						))}
					</select>
				</fieldset>

				<ChartCopyButton ref={chartRef} />
			</div>

			<TaxonomySunburst
				ref={chartRef}
				assignments={darkAssignments}
				taxonomiesByName={taxonomiesByName}
				parentRank={parentRank}
				childRank={childRank}
				title={`Dark taxa (< ${threshold}% identity): ${parentRank} > ${childRank}`}
			/>

			{rows.length === MAX_ROWS && (
				<p className="text-center text-sm opacity-70 mb-2">
					Showing the top {MAX_ROWS} dark taxa by relative abundance.
				</p>
			)}

			<div className="overflow-x-auto mt-6 self-stretch max-h-100">
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
							<tr key={r.taxonomy}>
								<td className="max-w-75 truncate">
									<Link
										className="link link-primary link-hover"
										href={exploreUrl({ table: "taxonomy", taxonomy: r.taxonomy })}
									>
										{r.taxonomy}
									</Link>
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
