"use client";

import { Assignment, Library, Occurrence, Sample, Taxonomy } from "@/app/generated/prisma/client";
import { Bar } from "react-chartjs-2";
import { useEffect, useRef, useState } from "react";
import distinctColors from "distinct-colors";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { TaxonomicRanks } from "@/types/objects";
import ChartCopyButton from "./ChartCopyButton";
import zoomPlugin from "chartjs-plugin-zoom";
import InfoButton from "../InfoButton";
import PaginationControls from "../paginated/PaginationControls";
import LoadingPaginationControls from "../paginated/LoadingPaginationControls";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, zoomPlugin);

export default function TaxaBarChart({
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
	const ref = useRef<ChartJS<"bar", { x: string; y: number }[]>>(null);

	const { textColor } = useDaisyTheme();

	const [rank, setRank] = useState("kingdom" as (typeof TaxonomicRanks)[0]);
	const [metricType, setMetricType] = useState("absolute" as "absolute" | "relative");
	const [averageBy, setAverageBy] = useState("lib_id");

	const [taxaPerPage, setTaxaPerPage] = useState(20);
	const [taxaPage, setTaxaPage] = useState(1);
	const [taxaCount, setTaxaCount] = useState(0);

	const [loading, setLoading] = useState(true);
	const [chartData, setChartData] = useState({ labels: [], datasets: [] } as {
		labels: string[];
		datasets: {
			data: { x: string; y: number }[];
			borderColor: string;
			backgroundColor: string;
			borderWidth: number;
		}[];
	});

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

			setTaxaCount(rankValues.size);
			let uniqueColors = distinctColors({ count: rankValues.size });

			let ranksOnPage = Array.from(rankValues).sort();
			if (taxaPerPage < ranksOnPage.length) {
				const start = (taxaPage - 1) * taxaPerPage;
				ranksOnPage = ranksOnPage.slice(start, start + taxaPerPage);
				uniqueColors = uniqueColors.slice(start, start + taxaPerPage);
			}

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

			let tempYMax = 0;
			setChartData({
				labels: averageBy === "lib_id" ? libIds : groupLabels,
				datasets: ranksOnPage.map((lev, i) => {
					let data = [] as { x: string; y: number }[];
					if (metricType === "relative") {
						data = libIds.map((lib_id) => {
							const absoluteValue = libIdRankQuantities[lib_id][lev];

							if (absoluteValue) {
								// Calculate total for this lib_id across all taxonomic values at this rank
								const total = Object.values(libIdRankQuantities[lib_id]).reduce((sum, val) => sum + val, 0);
								return { x: lib_id, y: (absoluteValue / total) * 100 };
							} else {
								return { x: lib_id, y: 0 };
							}
						});

						if (averageBy !== "lib_id") {
							data = groupLabels.map((val) => ({
								x: val,
								y:
									averageByGroups[val].reduce((sum, lib_id) => sum + data[libIds.indexOf(lib_id)].y, 0) /
									averageByGroups[val].length
							}));
						}
					} else {
						data = libIds.map((lib_id) => {
							const y = libIdRankQuantities[lib_id][lev];
							if (y > tempYMax) {
								tempYMax = y;
							}

							return { x: lib_id, y };
						});
					}

					return {
						label: lev,
						data,
						borderColor: uniqueColors[i].hex(),
						backgroundColor: uniqueColors[i].alpha(0.8).hex(),
						borderWidth: 1,
						barThickness: "flex"
					};
				})
			});
		}

		setLoading(false);
	}, [rank, metricType, averageBy, taxaPage, taxaPerPage]);

	return (
		<div className="relative">
			<div className="w-full flex justify-center items-center gap-5">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Taxonomic Rank:</legend>
					<select
						value={rank}
						onChange={(e) => {
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
						onChange={(e) => {
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
						onChange={(e) => {
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

			<form
				className="flex items-center justify-center gap-2"
				onSubmit={(e) => {
					e.preventDefault();
					const val = parseInt(new FormData(e.target as HTMLFormElement).get("taxaPerPage") as string);
					if (!isNaN(val)) {
						setLoading(true);
						setTaxaPerPage(val);
					}
				}}
			>
				<fieldset className="fieldset">
					<legend className="fieldset-legend w-full">
						<span>Taxa Per Page:</span>
						<InfoButton infoText="Making this too large can cause lag." type="warning" />
					</legend>
					<input type="number" name="taxaPerPage" className="input" defaultValue={taxaPerPage} disabled={loading} />
				</fieldset>
				<button className="btn btn-sm mt-7">Set</button>
			</form>
			<div className="flex justify-between items-center">
				{loading ? (
					<LoadingPaginationControls />
				) : (
					<PaginationControls
						page={taxaPage}
						take={taxaPerPage}
						count={taxaCount}
						setPage={setTaxaPage}
						sideEffect={() => setLoading(true)}
					/>
				)}
			</div>

			<Bar
				ref={ref}
				data={chartData}
				options={{
					responsive: true,
					parsing: false,
					normalized: true,
					animation: false,
					plugins: {
						legend: {
							position: "top",
							display: true,
							labels: {
								boxWidth: 12,
								font: { size: 10 },
								color: textColor
							}
						},
						title: {
							display: true,
							text: `${metricType === "relative" ? "Relative Abundance" : "Occurrences"} ${averageBy !== "lib_id" ? `averaged by ${averageBy}` : "in each Library"} colored by Taxonomy (${rank})`,
							color: textColor
						},
						zoom: {
							zoom: {
								mode: "x",
								wheel: {
									enabled: true
								},
								pinch: {
									enabled: true
								},
								drag: {
									enabled: true,
									backgroundColor: "rgba(225, 225, 225, 0.3)",
									borderColor: "rgba(225, 225, 225, 0.8)",
									borderWidth: 1
								}
							},
							pan: {
								enabled: true,
								mode: "x",
								modifierKey: "shift"
							}
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
								color: textColor
							},
							grid: {
								color: textColor + "1a" // Add low opacity
							}
						},
						y: {
							stacked: true,
							beginAtZero: true,
							min: 0,
							title: {
								display: true,
								text: metricType === "relative" ? "Relative Abundance (%)" : "Occurrences"
							},
							ticks: {
								color: textColor
							},
							grid: {
								color: textColor + "1a" // Add low opacity
							}
						}
					}
				}}
			/>

			{loading ? <div className="absolute left-0 top-0 w-full h-full bg-black/20 rounded-md"></div> : <></>}
		</div>
	);
}
