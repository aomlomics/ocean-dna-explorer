"use client";

import { useMemo, useRef, useState } from "react";
import { Chart } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, Tooltip, Title } from "chart.js";
import { MatrixController, MatrixElement } from "chartjs-chart-matrix";
import chroma from "chroma-js";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import ChartCopyButton from "./ChartCopyButton";
import { Library, Sample } from "@/app/generated/prisma/client";
import { TaxonomicRanks } from "@/types/objects";
import { OccsByFeatureid, TaxaAssignment, TaxonomiesById, Rank, matrixByRankAndSample } from "./taxaAggregation";

ChartJS.register(CategoryScale, LinearScale, MatrixController, MatrixElement, Tooltip, Title);

const TOP_N = 30;

export default function TaxaSampleHeatmap({
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
	const ref = useRef<ChartJS<"matrix">>(null);
	const { textColor, backgroundColor } = useDaisyTheme();
	const [rank, setRank] = useState<Rank>("family");

	const { data, taxa, samples, maxValue } = useMemo(() => {
		const matrix = matrixByRankAndSample(occsByFeatureid, assignments, taxonomiesById, sampleIdsByLibId, rank);

		// sort taxa by how many samples they're observed in (prevalence), most-prevalent first
		const topTaxa = Array.from(matrix.entries())
			.map(([label, row]) => ({ label, row, prevalence: row.size }))
			.sort((a, b) => b.prevalence - a.prevalence)
			.slice(0, TOP_N);

		// keep the real (numeric) sample ids for map lookups; only stringify for axis labels
		const sampleIdSet = new Set<Sample["id"]>();
		for (const t of topTaxa) for (const sampleId of t.row.keys()) sampleIdSet.add(sampleId);
		const sampleIds = Array.from(sampleIdSet).sort((a, b) => a - b);
		const samples = sampleIds.map(String);

		let maxValue = 0;
		const points: { x: string; y: string; v: number }[] = [];
		for (const t of topTaxa) {
			sampleIds.forEach((sampleId, i) => {
				const value = t.row.get(sampleId) ?? 0;
				maxValue = Math.max(maxValue, value);
				points.push({ x: samples[i], y: t.label, v: value });
			});
		}

		return { data: points, taxa: topTaxa.map((t) => t.label), samples, maxValue };
	}, [occsByFeatureid, assignments, taxonomiesById, sampleIdsByLibId, rank]);

	const colorScale = chroma.scale(["#f0f4f8", "#64ABDC", "#08306b"]).domain([0, maxValue || 1]);

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

			<p className="text-center text-sm opacity-70 mb-2">
				Showing the {TOP_N} most-prevalent {rank} values. Each row&apos;s colored cells show which samples it was
				detected in - count them to see how many samples that taxonomy was observed in overall.
			</p>

			{/*
				NOTE: chartjs-chart-matrix's width/height callback signature has changed across
				versions - verify against the version you install
				(https://github.com/kurkle/chartjs-chart-matrix) and adjust if needed.
			*/}
			<div style={{ height: Math.max(400, taxa.length * 22) }}>
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
								borderColor: backgroundColor,
								borderWidth: 1,
								width(ctx: any) {
									const area = ctx.chart.chartArea;
									return area ? area.width / Math.max(samples.length, 1) - 1 : 10;
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
								labels: samples,
								ticks: { color: textColor, autoSkip: true, maxRotation: 90, minRotation: 45 },
								title: { display: true, text: "Sample", color: textColor }
							},
							y: {
								type: "category",
								labels: taxa,
								offset: true,
								ticks: { color: textColor },
								title: { display: true, text: rank, color: textColor }
							}
						}
					}}
				/>
			</div>
		</div>
	);
}
