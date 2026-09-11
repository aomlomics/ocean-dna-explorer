"use client";

import { useMemo, useRef, useState } from "react";
import { Chart } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, Tooltip, Title } from "chart.js";
import { MatrixController, MatrixElement } from "chartjs-chart-matrix";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import ChartCopyButton from "../ChartCopyButton";
import { SampleModel, type OccurrenceModel } from "@/app/generated/prisma/models";
import { TaxonomicRanks } from "@/types/objects";
import chroma from "chroma-js";
import {
	type AssignsByFeatureid,
	type TaxonomiesByName,
	type LibsWithSampleById,
	HEATMAP_DEFAULT_RANK
} from "../wrappers/TaxonomyVisualize";
import type { TaxonomicRank } from "@/types/globals";

ChartJS.register(CategoryScale, LinearScale, MatrixController, MatrixElement, Tooltip, Title);

const TOP_N = 30;

//TODO: add checklists for taxonomies and samples
export default function TaxaSampleHeatmap({
	assignsByFeatureid,
	taxonomiesByName,
	libsWithSampleById,
	sampleLabels
}: {
	assignsByFeatureid: AssignsByFeatureid;
	taxonomiesByName: TaxonomiesByName;
	libsWithSampleById: LibsWithSampleById;
	sampleLabels: Map<SampleModel["id"], string>;
}) {
	const ref = useRef<ChartJS<"matrix">>(null);
	const { textColor, secondaryColor, accentColor } = useDaisyTheme();
	const gridColor = chroma(textColor).alpha(0.3).hex();
	const [rank, setRank] = useState(HEATMAP_DEFAULT_RANK);

	const { data, taxa, maxValue, median } = useMemo(() => {
		const matrix = {} as Record<string, Map<SampleModel["id"], OccurrenceModel["organismQuantity"]>>;

		for (const assign of Object.values(assignsByFeatureid)) {
			const row = (matrix[taxonomiesByName[assign.taxonomy]![rank] ?? "Unassigned"] ??= new Map());

			for (const occ of assign.Occurrences) {
				const sampId = libsWithSampleById.get(occ.Library.id)!.id;
				row.set(sampId, (row.get(sampId) ?? 0) + occ.organismQuantity);
			}
		}

		// sort taxa by how many samples they're observed in (prevalence), most-prevalent first
		const topTaxaMatrix = Object.entries(matrix)
			.sort((a, b) => b[1].size - a[1].size)
			.slice(0, TOP_N);

		let maxValue = 0;
		const points = topTaxaMatrix.flatMap(([y, row]) =>
			Array.from(row.entries()).map(([sampleId, v]) => {
				maxValue = Math.max(maxValue, v);
				return { x: sampleLabels.get(sampleId)!, y, v };
			})
		);

		const filtered = points.filter((p) => p.v);

		return {
			data: points,
			taxa: topTaxaMatrix.map((t) => t[0]),
			maxValue,
			median: filtered.sort((a, b) => a.v - b.v)[Math.floor(filtered.length / 2)]?.v ?? 0
		};
	}, [assignsByFeatureid, taxonomiesByName, libsWithSampleById, rank]);

	const colorScale = chroma.scale(["#f1f5f9", accentColor, secondaryColor]).domain([0, median, maxValue]) as (
		v: number
	) => chroma.Color;

	return (
		<div className="relative p-6">
			<div className="w-full flex justify-center items-end gap-5 mb-4">
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

			<p className="text-center text-sm opacity-70 mb-2">
				Showing the {TOP_N} most-prevalent {rank} values. Each row&apos;s colored cells show which sample it was
				detected in
			</p>

			<div style={{ height: Math.max(400, taxa.length * 28) }}>
				<Chart
					ref={ref}
					type="matrix"
					data={{
						datasets: [
							{
								data,
								backgroundColor(ctx: any) {
									const v = ctx.raw?.v ?? 0;
									return v > 0 ? colorScale(v).hex() : "transparent";
								},
								borderColor(ctx: any) {
									const v = ctx.raw?.v ?? 0;
									return v > 0 ? textColor : "transparent";
								},
								borderWidth: 0.5,
								width(ctx: any) {
									const area = ctx.chart.chartArea;
									return area ? area.width / Math.max(sampleLabels.size, 1) - 1 : 10;
								},
								height(ctx: any) {
									const area = ctx.chart.chartArea;
									return area ? area.height / Math.max(taxa.length, 1) - 1 : 10;
								}
							}
						]
					}}
					options={{
						responsive: true,
						maintainAspectRatio: false,
						plugins: {
							title: { display: true, text: `Abundance heatmap: ${rank} × sample`, color: textColor },
							legend: { display: false },
							tooltip: {
								callbacks: {
									title() {
										return "";
									},
									label(item: any) {
										return `${item.raw.y} in sample ${item.raw.x}: ${item.raw.v.toLocaleString()} reads`;
									}
								}
							}
						},
						scales: {
							x: {
								type: "category",
								labels: Array.from(sampleLabels.values()),
								ticks: {
									color: textColor,
									autoSkip: true,
									maxRotation: 90,
									minRotation: 45
								},
								title: {
									display: true,
									text: "Sample",
									color: textColor
								},
								grid: {
									color: gridColor
								}
							},
							y: {
								type: "category",
								labels: taxa,
								offset: true,
								ticks: {
									color: textColor,
									autoSkip: false
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
				/>
			</div>
		</div>
	);
}
