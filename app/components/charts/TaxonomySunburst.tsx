"use client";

import { useMemo, useRef } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Title } from "chart.js";
import distinctColors from "distinct-colors";
import chroma from "chroma-js";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import ChartCopyButton from "./ChartCopyButton";
import { OccsByFeatureid, TaxaAssignment, TaxonomiesById, Rank, aggregateByTwoRanks } from "./taxaAggregation";

ChartJS.register(ArcElement, Tooltip, Title);

function shades(baseHex: string, count: number): string[] {
	if (count <= 1) return [baseHex];
	return chroma
		.scale([baseHex, "white"])
		.mode("lab")
		.colors(count + 2)
		.slice(0, count);
}

/**
 * Chart.js has no native sunburst type, so this approximates one with two concentric
 * Doughnut rings: an inner ring for `parentRank` and an outer ring for `childRank`.
 * Children are laid out contiguously within their parent's angular span (both rings
 * sum to the same total and Chart.js draws slices in array order), so the outer wedges
 * line up under their matching inner wedge.
 */
export default function TaxonomySunburst({
	occsByFeatureid,
	assignments,
	taxonomiesById,
	parentRank,
	childRank,
	title
}: {
	occsByFeatureid: OccsByFeatureid;
	assignments: TaxaAssignment[];
	taxonomiesById: TaxonomiesById;
	parentRank: Rank;
	childRank: Rank;
	title?: string;
}) {
	const ref = useRef<ChartJS<"doughnut">>(null);
	const { textColor, backgroundColor } = useDaisyTheme();

	const { innerLabels, innerData, outerLabels, outerData, innerColors, outerColors } = useMemo(() => {
		const totals = aggregateByTwoRanks(occsByFeatureid, assignments, taxonomiesById, parentRank, childRank);

		const parents = Array.from(totals.entries())
			.map(([parent, childMap]) => ({
				parent,
				total: Array.from(childMap.values()).reduce((a, b) => a + b, 0),
				children: Array.from(childMap.entries())
					.filter(([, v]) => v > 0)
					.sort((a, b) => b[1] - a[1])
			}))
			.filter((p) => p.total > 0)
			.sort((a, b) => b.total - a.total);

		const parentPalette = distinctColors({ count: Math.max(parents.length, 1), chromaMin: 35, lightMin: 35 });

		const innerLabels: string[] = [];
		const innerData: number[] = [];
		const innerColors: string[] = [];
		const outerLabels: string[] = [];
		const outerData: number[] = [];
		const outerColors: string[] = [];

		parents.forEach((p, pi) => {
			innerLabels.push(p.parent);
			innerData.push(p.total);
			innerColors.push(parentPalette[pi].hex());

			const childShades = shades(parentPalette[pi].hex(), p.children.length);
			p.children.forEach(([child, value], ci) => {
				outerLabels.push(`${p.parent} > ${child}`);
				outerData.push(value);
				outerColors.push(childShades[ci]);
			});
		});

		return { innerLabels, innerData, outerLabels, outerData, innerColors, outerColors };
	}, [occsByFeatureid, assignments, taxonomiesById, parentRank, childRank]);

	return (
		<div className="relative p-6 flex flex-col items-center">
			<div className="w-full flex justify-end mb-2">
				<ChartCopyButton ref={ref} />
			</div>

			<div className="w-full max-w-125">
				<Doughnut
					ref={ref}
					data={{
						// no top-level `labels` here on purpose: the two rings have different
						// numbers of slices, and the tooltip callback below picks the right
						// label array itself via ctx.datasetIndex
						datasets: [
							{
								label: parentRank,
								data: innerData,
								backgroundColor: innerColors,
								borderColor: backgroundColor,
								borderWidth: 1,
								weight: 1
							},
							{
								label: childRank,
								data: outerData,
								backgroundColor: outerColors,
								borderColor: backgroundColor,
								borderWidth: 1,
								weight: 1.6
							}
						]
					}}
					options={{
						responsive: true,
						plugins: {
							title: { display: true, text: title ?? `${parentRank} > ${childRank}`, color: textColor },
							legend: { display: false },
							tooltip: {
								callbacks: {
									label(ctx) {
										const label = ctx.datasetIndex === 0 ? innerLabels[ctx.dataIndex] : outerLabels[ctx.dataIndex];
										return `${label}: ${(ctx.raw as number).toLocaleString()} reads`;
									}
								}
							}
						}
					}}
				/>
			</div>
		</div>
	);
}
