"use client";

import { useMemo, type RefObject } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Title } from "chart.js";
import distinctColors from "distinct-colors";
import chroma from "chroma-js";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import type { AssignsByFeatureid, TaxonomiesByName } from "../wrappers/TaxonomyVisualize";
import type { TaxonomicRank } from "@/types/globals";

ChartJS.register(ArcElement, Tooltip, Title);

export default function TaxonomySunburst({
	ref,
	assignments,
	taxonomiesByName,
	parentRank,
	childRank,
	title
}: {
	ref: RefObject<ChartJS<"doughnut"> | null>;
	assignments: AssignsByFeatureid[keyof AssignsByFeatureid][];
	taxonomiesByName: TaxonomiesByName;
	parentRank: TaxonomicRank;
	childRank: TaxonomicRank;
	title?: string;
}) {
	const { textColor, backgroundColor } = useDaisyTheme();

	const { innerLabels, innerData, innerColors, outerLabels, outerData, outerColors } = useMemo(() => {
		const totals = new Map<string, Map<string, number>>();

		for (const assign of assignments) {
			const taxonomy = taxonomiesByName[assign.taxonomy]!;
			const parent = taxonomy[parentRank];
			const child = taxonomy[childRank];

			if (parent && child) {
				let childMap = totals.get(parent);
				if (!childMap) {
					childMap = new Map();
					totals.set(parent, childMap);
				}

				for (const occ of assign.Occurrences) {
					if (occ.organismQuantity) {
						childMap.set(child, (childMap.get(child) ?? 0) + Number(occ.organismQuantity));
					}
				}
			}
		}

		const parents = Array.from(totals.entries())
			.map(([parent, childMap]) => {
				const children = Array.from(childMap.entries())
					.filter(([, value]) => value > 0)
					.sort((a, b) => b[1] - a[1]);

				const total = children.reduce((sum, [, value]) => sum + value, 0);

				return {
					parent,
					total,
					children
				};
			})
			.filter((parent) => parent.total > 0)
			.sort((a, b) => b.total - a.total);

		const parentPalette = distinctColors({
			count: Math.max(parents.length, 1),
			chromaMin: 35,
			lightMin: 35
		});

		const innerLabels: string[] = [];
		const innerData: number[] = [];
		const innerColors: string[] = [];

		const outerLabels: string[] = [];
		const outerData: number[] = [];
		const outerColors: string[] = [];

		parents.forEach((parent, parentIndex) => {
			const baseColor = parentPalette[parentIndex]!.hex();

			innerLabels.push(parent.parent);
			innerData.push(parent.total);
			innerColors.push(baseColor);

			const childColors =
				parent.children.length <= 1
					? [baseColor]
					: chroma
							.scale([baseColor, "white"])
							.mode("lab")
							.colors(parent.children.length + 2)
							.slice(0, parent.children.length);

			parent.children.forEach(([child, value], childIndex) => {
				outerLabels.push(`${parent.parent} > ${child}`);
				outerData.push(value);
				outerColors.push(childColors[childIndex]!);
			});
		});

		return {
			innerLabels,
			innerData,
			innerColors,
			outerLabels,
			outerData,
			outerColors
		};
	}, [assignments, taxonomiesByName, parentRank, childRank]);

	return (
		<div className="w-full max-w-125">
			<Doughnut
				ref={ref}
				data={{
					datasets: [
						{
							label: childRank,
							data: outerData,
							backgroundColor: outerColors,
							borderColor: backgroundColor,
							borderWidth: 1,
							weight: 1.6
						},
						{
							label: parentRank,
							data: innerData,
							backgroundColor: innerColors,
							borderColor: backgroundColor,
							borderWidth: 1,
							weight: 1
						}
					]
				}}
				options={{
					responsive: true,
					plugins: {
						title: {
							display: true,
							text: title ?? `${parentRank} > ${childRank}`,
							color: textColor
						},
						legend: {
							display: false
						},
						tooltip: {
							callbacks: {
								label(ctx) {
									const label = ctx.datasetIndex === 0 ? outerLabels[ctx.dataIndex] : innerLabels[ctx.dataIndex];
									return `${label}: ${(ctx.raw as number).toLocaleString()} reads`;
								}
							}
						}
					}
				}}
			/>
		</div>
	);
}
