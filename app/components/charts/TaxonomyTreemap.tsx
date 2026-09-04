"use client";

import { useMemo, useRef, useState } from "react";
import { Chart } from "react-chartjs-2";
import { Chart as ChartJS, Tooltip, Title } from "chart.js";
import { TreemapController, TreemapElement } from "chartjs-chart-treemap";
import distinctColors from "distinct-colors";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import ChartCopyButton from "./ChartCopyButton";
import { TaxonomicRanks } from "@/types/objects";
import { OccsByFeatureid, TaxaAssignment, TaxonomiesById, Rank, aggregateByTwoRanks } from "./taxaAggregation";

ChartJS.register(TreemapController, TreemapElement, Tooltip, Title);

export default function TaxonomyTreemap({
	occsByFeatureid,
	assignments,
	taxonomiesById
}: {
	occsByFeatureid: OccsByFeatureid;
	assignments: TaxaAssignment[];
	taxonomiesById: TaxonomiesById;
}) {
	const ref = useRef<ChartJS<"treemap", any[]>>(null);
	const { textColor, backgroundColor } = useDaisyTheme();

	const [parentRank, setParentRank] = useState<Rank>("phylum");
	const [childRank, setChildRank] = useState<Rank>("family");

	// child rank must be more specific than parent, otherwise nesting is meaningless
	const validChildRanks = TaxonomicRanks.slice(TaxonomicRanks.indexOf(parentRank) + 1);

	const { rows, parentColors } = useMemo(() => {
		const totals = aggregateByTwoRanks(occsByFeatureid, assignments, taxonomiesById, parentRank, childRank);

		const rows: { parent: string; child: string; value: number }[] = [];
		for (const [parent, childMap] of totals) {
			for (const [child, value] of childMap) {
				if (value > 0) rows.push({ parent, child, value });
			}
		}

		const parents = Array.from(new Set(rows.map((r) => r.parent))).sort();
		const colors = distinctColors({ count: Math.max(parents.length, 1), chromaMin: 35, lightMin: 35 });
		const parentColors = new Map(parents.map((p, i) => [p, colors[i]]));

		return { rows, parentColors };
	}, [occsByFeatureid, assignments, taxonomiesById, parentRank, childRank]);

	return (
		<div className="relative p-6">
			<div className="w-full flex flex-wrap justify-center items-end gap-5 mb-4">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Large (outer) boxes:</legend>
					<select
						value={parentRank}
						onChange={(e) => {
							const newParent = e.target.value as Rank;
							setParentRank(newParent);
							// keep childRank valid relative to the new parent
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
					<legend className="fieldset-legend">Small (inner) boxes:</legend>
					<select value={childRank} onChange={(e) => setChildRank(e.target.value as Rank)} className="select">
						{validChildRanks.map((r) => (
							<option key={r}>{r}</option>
						))}
					</select>
				</fieldset>

				<ChartCopyButton ref={ref} />
			</div>

			{/*
				NOTE: chartjs-chart-treemap's callback context shape (ctx.raw._data, ctx.raw.v) has
				shifted across major versions - verify these against the version you install
				(https://github.com/kurkle/chartjs-chart-treemap) and adjust if needed.
			*/}
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
							borderColor: backgroundColor,
							backgroundColor(ctx: any) {
								const data = ctx.raw?._data;
								if (!data) return "transparent";
								const color = parentColors.get(data.parent);
								if (!color) return "transparent";
								// shade inner (child) boxes lighter than the outer parent box
								return data.child ? color.alpha(0.6).hex() : color.alpha(0.95).hex();
							},
							labels: {
								display: true,
								color: textColor,
								font: { size: 11 },
								formatter(ctx: any) {
									return ctx.raw?._data?.child ?? ctx.raw?._data?.parent ?? "";
								}
							}
						}
					]
				}}
				options={{
					responsive: true,
					plugins: {
						title: { display: true, text: `Relative Abundance: ${parentRank} > ${childRank}`, color: textColor },
						tooltip: {
							callbacks: {
								title(items: any[]) {
									const d = items[0]?.raw?._data;
									return d?.child ? `${d.parent} > ${d.child}` : (d?.parent ?? "");
								},
								label(item: any) {
									return `${item.raw.v.toLocaleString()} reads`;
								}
							}
						}
					}
				}}
			/>
		</div>
	);
}
