"use client";

import { useMemo, useRef, useState } from "react";
import { Chart } from "react-chartjs-2";
import { Chart as ChartJS, Tooltip, Title, type ChartDatasetProperties, LinearScale } from "chart.js";
import { TreemapController, TreemapElement } from "chartjs-chart-treemap";
import distinctColors from "distinct-colors";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import ChartCopyButton from "../ChartCopyButton";
import { TaxonomicRanks } from "@/types/objects";
import type { TaxonomicRank } from "@/types/globals";
import {
	TREEMAP_DEFAULT_CHILD_RANK,
	TREEMAP_DEFAULT_PARENT_RANK,
	type AssignsByFeatureid,
	type TaxonomiesByName
} from "../wrappers/TaxonomyVisualize";
import type { OccurrenceModel } from "@/app/generated/prisma/models";
import chroma, { type Color } from "chroma-js";

ChartJS.register(TreemapController, TreemapElement, LinearScale, Tooltip, Title);

function getContrastText(color: Color) {
	const hex = color.hex();
	const whiteContrast = chroma.contrast(hex, "#ffffff");
	const blackContrast = chroma.contrast(hex, "#000000");

	return whiteContrast >= blackContrast ? "#ffffff" : "#000000";
}

export default function TaxonomyTreemap({
	assignsByFeatureid,
	taxonomiesByName
}: {
	assignsByFeatureid: AssignsByFeatureid;
	taxonomiesByName: TaxonomiesByName;
}) {
	const ref = useRef<ChartJS<"treemap", any[]>>(null);
	const { textColor } = useDaisyTheme();

	const [parentRank, setParentRank] = useState(TREEMAP_DEFAULT_PARENT_RANK);
	const [childRank, setChildRank] = useState(TREEMAP_DEFAULT_CHILD_RANK);

	// Child must be more specific than parent.
	const validChildRanks = TaxonomicRanks.slice(TaxonomicRanks.indexOf(parentRank) + 1);

	const { rows, parentColors } = useMemo(() => {
		const totals = new Map<string, Map<string, OccurrenceModel["organismQuantity"]>>();

		for (const assign of Object.values(assignsByFeatureid)) {
			const taxonomy = taxonomiesByName[assign.taxonomy]!;
			const parent = taxonomy[parentRank];
			const child = taxonomy[childRank];

			if (parent && child) {
				let childMap = totals.get(parent);

				if (!childMap) {
					childMap = new Map<string, number>();
					totals.set(parent, childMap);
				}

				let total = 0;
				for (const occ of assign.Occurrences) {
					const quantity = Number(occ.organismQuantity);

					if (Number.isFinite(quantity) && quantity > 0) {
						total += quantity;
					}
				}

				if (total > 0) {
					childMap.set(child, (childMap.get(child) ?? 0) + total);
				}
			}
		}

		const rows: { parent: string; child: string; value: number }[] = [];

		for (const [parent, childMap] of totals) {
			for (const [child, value] of childMap) {
				if (value > 0) {
					rows.push({
						parent,
						child,
						value
					});
				}
			}
		}

		const parents = Array.from(new Set(rows.map((row) => row.parent))).sort();

		const colors = distinctColors({
			count: Math.max(parents.length, 1),
			chromaMin: 35,
			lightMin: 35
		});

		const parentColors = new Map(parents.map((parent, index) => [parent, colors[index]]));

		return {
			rows,
			parentColors
		};
	}, [assignsByFeatureid, taxonomiesByName, parentRank, childRank]);

	return (
		<div className="relative p-6">
			<div className="w-full flex flex-wrap justify-center items-end gap-5 mb-4">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Large (outer) boxes:</legend>

					<select
						value={parentRank}
						onChange={(e) => {
							const newParent = e.target.value as TaxonomicRank;

							setParentRank(newParent);

							// Make sure the child rank remains more specific.
							if (TaxonomicRanks.indexOf(newParent) >= TaxonomicRanks.indexOf(childRank)) {
								setChildRank(TaxonomicRanks[TaxonomicRanks.indexOf(newParent) + 1] ?? newParent);
							}
						}}
						className="select"
					>
						{TaxonomicRanks.slice(0, -1).map((rank) => (
							<option key={rank} value={rank}>
								{rank}
							</option>
						))}
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Small (inner) boxes:</legend>

					<select value={childRank} onChange={(e) => setChildRank(e.target.value as TaxonomicRank)} className="select">
						{validChildRanks.map((rank) => (
							<option key={rank} value={rank}>
								{rank}
							</option>
						))}
					</select>
				</fieldset>

				<ChartCopyButton ref={ref} />
			</div>

			<Chart
				ref={ref}
				type="treemap"
				data={{
					datasets: [
						{
							tree: rows,
							key: "value",
							groups: ["parent", "child"],
							spacing: 1,
							borderWidth: 1,
							borderColor: "black",
							backgroundColor(ctx: any) {
								const data = ctx.raw?._data;
								if (!data) {
									return "transparent";
								}

								const color = parentColors.get(data.parent);
								if (!color) {
									return "transparent";
								}

								return data.group === "child" ? color.alpha(0.6).hex() : color.alpha(0.95).hex();
							},
							labels: {
								display: true,
								color(ctx: any) {
									const color = parentColors.get(ctx.raw?._data?.path?.split(".")[0]);
									if (!color) {
										return textColor;
									}

									return getContrastText(color);
								},
								font: {
									size: 11
								},
								formatter(ctx: any) {
									return ctx.raw?._data?.label ?? "";
								}
							},
							captions: {
								display: true,
								color(ctx: any) {
									const color = parentColors.get(ctx.raw?._data?.parent);
									if (!color) {
										return textColor;
									}

									return getContrastText(color);
								},
								font: {
									size: 11
								}
							}
						} as unknown as ChartDatasetProperties<"treemap", any[]>
					]
				}}
				options={{
					responsive: true,
					plugins: {
						legend: {
							display: false
						},
						title: {
							display: true,
							text: `Relative Abundance: ${parentRank} > ${childRank}`,
							color: textColor
						},
						tooltip: {
							callbacks: {
								title(items: any[]) {
									const parentData = items[0]?.raw?._data;
									const childData = items[1]?.raw?._data;

									return `${parentData.label}${childData ? " > " + childData.label : ""}`;
								},
								label(item: any) {
									const value = Number(item.raw?.v ?? 0);
									return `${value.toLocaleString()} reads`;
								}
							}
						}
					}
				}}
			/>
		</div>
	);
}
