"use client";

import { useMemo, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import distinctColors from "distinct-colors";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import ChartCopyButton from "./ChartCopyButton";
import { TaxonomicRanks, RankPlurals } from "@/types/objects";
import { OccsByFeatureid, TaxaAssignment, TaxonomiesById, Rank } from "./taxaAggregation";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, zoomPlugin);

const DEFAULT_RANK: Rank = "phylum";
const MAX_SERIES_WHEN_UNFILTERED = 15;

export default function RelativeAbundanceByTaxonomy({
	occsByFeatureid,
	assignments,
	taxonomiesById
}: {
	occsByFeatureid: OccsByFeatureid;
	assignments: TaxaAssignment[];
	taxonomiesById: TaxonomiesById;
}) {
	const ref = useRef<ChartJS<"bar", { x: string; y: number }[]>>(null);
	const { textColor } = useDaisyTheme();

	const [rank, setRank] = useState<Rank>(DEFAULT_RANK);
	const [search, setSearch] = useState("");

	const { chartData, matchCount } = useMemo(() => {
		// lib_id -> rankValue -> quantity, plus per-lib_id and per-rankValue grand totals
		const libRankQuantities = new Map<string, Map<string, number>>();
		const libTotals = new Map<string, number>();
		const rankTotals = new Map<string, number>();

		for (const assign of assignments) {
			const occs = occsByFeatureid[assign.featureid];
			if (!occs) continue;

			const label = taxonomiesById[assign.Taxonomy.id]?.[rank] || "Unassigned";

			for (const occ of occs) {
				if (!libRankQuantities.has(occ.lib_id)) libRankQuantities.set(occ.lib_id, new Map());
				const rankMap = libRankQuantities.get(occ.lib_id)!;
				rankMap.set(label, (rankMap.get(label) ?? 0) + occ.organismQuantity);

				libTotals.set(occ.lib_id, (libTotals.get(occ.lib_id) ?? 0) + occ.organismQuantity);
				rankTotals.set(label, (rankTotals.get(label) ?? 0) + occ.organismQuantity);
			}
		}

		const libIds = Array.from(libTotals.keys()).sort();

		// the % denominator always comes from every taxon at this rank, even when the
		// series shown below are filtered down to a search match - that's what makes
		// this a "relative" abundance rather than a percentage of just the matches
		let matchingLabels = Array.from(rankTotals.keys());
		if (search.trim()) {
			matchingLabels = matchingLabels.filter((l) => l.toLowerCase().includes(search.trim().toLowerCase()));
		} else {
			matchingLabels = matchingLabels
				.sort((a, b) => (rankTotals.get(b) ?? 0) - (rankTotals.get(a) ?? 0))
				.slice(0, MAX_SERIES_WHEN_UNFILTERED);
		}
		matchingLabels.sort();

		const colors = distinctColors({ count: Math.max(matchingLabels.length, 1), chromaMin: 35, lightMin: 35 });

		return {
			matchCount: matchingLabels.length,
			chartData: {
				labels: libIds,
				datasets: matchingLabels.map((label, i) => ({
					label,
					data: libIds.map((lib_id) => {
						const total = libTotals.get(lib_id) ?? 0;
						const value = libRankQuantities.get(lib_id)?.get(label) ?? 0;
						return { x: lib_id, y: total > 0 ? (value / total) * 100 : 0 };
					}),
					borderColor: colors[i].hex(),
					backgroundColor: colors[i].alpha(0.8).hex(),
					borderWidth: 1,
					barThickness: "flex" as const
				}))
			}
		};
	}, [rank, search, assignments, occsByFeatureid, taxonomiesById]);

	return (
		<div className="relative p-6">
			<div className="w-full flex flex-wrap justify-center items-end gap-5 mb-4">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Taxonomic Rank:</legend>
					<select value={rank} onChange={(e) => setRank(e.target.value as Rank)} className="select">
						{TaxonomicRanks.map((r) => (
							<option key={r}>{r}</option>
						))}
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Taxonomy contains:</legend>
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={`e.g. a ${rank} name...`}
						className="input"
					/>
				</fieldset>

				<button className="btn mt-7" onClick={() => ref.current?.resetZoom()}>
					Reset Zoom
				</button>

				<ChartCopyButton ref={ref} />
			</div>

			{!search.trim() && (
				<p className="text-center text-sm opacity-70 mb-2">
					Showing the top {MAX_SERIES_WHEN_UNFILTERED} {RankPlurals[rank]} by abundance. Type in the box above to
					find a specific taxonomy instead.
				</p>
			)}
			{search.trim() && matchCount === 0 && (
				<p className="text-center text-sm opacity-70 mb-2">No {RankPlurals[rank]} match &quot;{search}&quot;.</p>
			)}

			<Bar
				ref={ref}
				data={chartData}
				options={{
					responsive: true,
					parsing: false,
					normalized: true,
					animation: false,
					plugins: {
						legend: { position: "top", labels: { boxWidth: 12, font: { size: 10 }, color: textColor } },
						title: {
							display: true,
							text: `Relative Abundance by ${rank}${search.trim() ? ` (filtered: "${search}")` : ""}`,
							color: textColor
						},
						zoom: {
							zoom: { mode: "x", wheel: { enabled: true }, pinch: { enabled: true } },
							pan: { enabled: true, mode: "x", modifierKey: "shift" }
						}
					},
					scales: {
						x: {
							stacked: true,
							title: { display: true, text: "Library", color: textColor },
							ticks: { color: textColor }
						},
						y: {
							stacked: true,
							beginAtZero: true,
							max: 100,
							title: { display: true, text: "Relative Abundance (%)", color: textColor },
							ticks: { color: textColor }
						}
					}
				}}
			/>
		</div>
	);
}
