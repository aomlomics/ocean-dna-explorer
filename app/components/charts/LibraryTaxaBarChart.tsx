"use client";

import { Assignment, Library, Occurrence, Sample, Taxonomy } from "@/app/generated/prisma/client";
import { Bar } from "react-chartjs-2";
import { useEffect, useRef, useState } from "react";
import distinctColors from "distinct-colors";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { TaxonomicRanks } from "@/types/objects";
import ChartCopyButton from "./ChartCopyButton";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function LibraryTaxaBarChart({
	occsByFeatureid,
	assignments,
	taxonomiesById,
	samplesById,
	sampleIdsByLibId
}: {
	occsByFeatureid: Record<
		Occurrence["featureid"],
		{
			lib_id: Occurrence["lib_id"];
			featureid: Occurrence["featureid"];
			organismQuantity: Occurrence["organismQuantity"];
		}[]
	>;
	assignments: {
		featureid: Assignment["featureid"];
		Taxonomy: {
			id: number;
		};
	}[];
	taxonomiesById: Record<Taxonomy["id"], Omit<Taxonomy, "taxonomy" | "verbatimIdentification">>;
	samplesById: Record<Sample["id"], Sample & { Libraries: { lib_id: Library["lib_id"] }[] }>;
	sampleIdsByLibId: Record<Library["lib_id"], Sample["id"]>;
}) {
	const ref = useRef<ChartJS<"bar">>(null);

	const [rank, setRank] = useState("kingdom" as (typeof TaxonomicRanks)[0]);
	const [metricType, setMetricType] = useState("absolute" as "absolute" | "relative");
	const [averageBy, setAverageBy] = useState("lib_id");

	const [loading, setLoading] = useState(false);
	const [chartData, setChartData] = useState(
		undefined as
			| {
					labels: string[];
					datasets: {
						label: string;
						data: number[];
						borderColor: string;
						backgroundColor: string;
						borderWidth: number;
					}[];
			  }
			| undefined
	);

	useEffect(() => {
		if (!(averageBy !== "lib_id" && metricType === "absolute")) {
			//assemble counts on label.rank
			const rankValues = new Set() as Set<string>;
			const libIdRankQuantities = {} as Record<string, Record<string, number>>;
			for (const assign of assignments) {
				if (occsByFeatureid[assign.featureid]) {
					let rankVal = taxonomiesById[assign.Taxonomy.id][rank];
					if (!rankVal) {
						rankVal = "undefined";
					}
					rankValues.add(rankVal);

					for (const occ of occsByFeatureid[assign.featureid]) {
						if (!libIdRankQuantities[occ.lib_id]) {
							//initialize both library and rank
							libIdRankQuantities[occ.lib_id] = {
								[rankVal]: occ.organismQuantity
							};
						} else if (!libIdRankQuantities[occ.lib_id][rankVal]) {
							//initialize rank
							libIdRankQuantities[occ.lib_id][rankVal] = occ.organismQuantity;
						} else {
							//add to count
							libIdRankQuantities[occ.lib_id][rankVal] += occ.organismQuantity;
						}
					}
				}
			}

			const uniqueColors = distinctColors({ count: rankValues.size });

			const libIds = Object.keys(libIdRankQuantities).sort();
			let averageByGroups = {} as Record<string, Library["lib_id"][]>;
			if (averageBy !== "lib_id") {
				for (const lib_id of libIds) {
					const val = samplesById[sampleIdsByLibId[lib_id]][averageBy as keyof Sample]?.toString() || "undefined";

					if (averageByGroups[val]) {
						averageByGroups[val].push(lib_id);
					} else {
						averageByGroups[val] = [lib_id];
					}
				}
			}
			const groupLabels = Object.keys(averageByGroups).sort();

			setChartData({
				labels: averageBy === "lib_id" ? libIds : groupLabels,
				datasets: Array.from(rankValues)
					.sort()
					.map((lev, i) => {
						let data = [] as number[];
						if (metricType === "relative") {
							data = libIds.map((lib_id) => {
								const absoluteValue = libIdRankQuantities[lib_id][lev];

								if (absoluteValue) {
									// Calculate total for this lib_id across all taxonomic values at this rank
									const total = Object.values(libIdRankQuantities[lib_id]).reduce((sum, val) => sum + val, 0);
									return (absoluteValue / total) * 100;
								} else {
									return 0;
								}
							});

							if (averageBy !== "lib_id") {
								data = groupLabels.map(
									(val) =>
										averageByGroups[val].reduce((sum, lib_id) => sum + data[libIds.indexOf(lib_id)], 0) /
										averageByGroups[val].length
								);
							}
						} else {
							data = libIds.map((lib_id) => libIdRankQuantities[lib_id][lev]);
						}

						return {
							label: lev,
							data,
							borderColor: uniqueColors[i].hex(),
							backgroundColor: uniqueColors[i].alpha(0.8).hex(),
							borderWidth: 1
						};
					})
			});
		}

		setLoading(false);
	}, [rank, metricType, averageBy]);

	return (
		<div className="relative">
			<div className="w-full flex justify-center items-center gap-5">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Taxonomic Rank:</legend>
					<select
						value={rank}
						onChange={async (e) => {
							setLoading(true);
							setRank(e.target.value as (typeof TaxonomicRanks)[0]);
						}}
						className="select"
						disabled={loading}
					>
						{TaxonomicRanks.map((rank) => (
							<option key={rank}>{rank}</option>
						))}
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Display as:</legend>
					<select
						value={metricType}
						onChange={async (e) => {
							setLoading(true);
							setMetricType(e.target.value as typeof metricType);
						}}
						className="select"
						disabled={loading || averageBy !== "lib_id"}
					>
						<option value="absolute">Absolute Counts</option>
						<option value="relative">Relative Abundance (%)</option>
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Average by:</legend>
					<select
						value={averageBy}
						onChange={async (e) => {
							setLoading(true);
							if (e.target.value !== "lib_id" && metricType === "absolute") {
								setMetricType("relative");
							}
							setAverageBy(e.target.value);
						}}
						className="select"
						disabled={loading}
					>
						<option>lib_id</option>
						<option>samp_collect_method</option>
					</select>
				</fieldset>

				<ChartCopyButton ref={ref} disabled={loading} />
			</div>

			{chartData ? (
				<Bar
					ref={ref}
					data={chartData}
					options={{
						responsive: true,
						plugins: {
							legend: {
								position: "top",
								display: true,
								labels: {
									boxWidth: 12,
									font: { size: 10 }
								}
							},
							title: {
								display: true,
								text: `${metricType === "relative" ? "Relative Abundance" : "Occurrences"} ${averageBy !== "lib_id" ? `averaged by ${averageBy}` : "in each Library"} colored by Taxonomy (${rank})`
							}
						},
						scales: {
							x: {
								stacked: true,
								title: {
									display: true,
									text: averageBy
								},
								ticks: {
									autoSkip: false
								}
							},
							y: {
								stacked: true,
								beginAtZero: true,
								max: metricType === "relative" ? 100 : undefined,
								title: {
									display: true,
									text: metricType === "relative" ? "Relative Abundance (%)" : "Occurrences"
								}
							}
						}
					}}
				/>
			) : (
				<></>
			)}

			{loading ? <div className="absolute left-0 top-0 w-full h-full bg-black/20 rounded-md"></div> : <></>}
		</div>
	);
}
