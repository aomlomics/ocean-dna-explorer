"use client";

import { Assignment, Library, Occurrence, Sample, Taxonomy } from "@/app/generated/prisma/client";
import { Bar } from "react-chartjs-2";
import { useEffect, useRef, useState } from "react";
import distinctColors from "distinct-colors";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { RankPlurals, TaxonomicRanks } from "@/types/objects";
import ChartCopyButton from "./ChartCopyButton";
import zoomPlugin from "chartjs-plugin-zoom";
import InfoButton from "../InfoButton";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import Checklist from "../Checklist";
import chroma from "chroma-js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, zoomPlugin);

const DEFAULT_MAX_TAXONOMIES = 20;

//TODO: paginate on averageBy
export default function TaxaBarChart({
	occsByFeatureid,
	assignments,
	taxonomiesById,
	samplesById,
	sampleIdsByLibId,
	sampFields,
	userDefinedFields
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
	sampFields: string[];
	userDefinedFields?: Set<string>;
}) {
	const ref = useRef<ChartJS<"bar", { x: string; y: number }[]>>(null);

	const { textColor } = useDaisyTheme();
	const gridColor = chroma(textColor).alpha(0.3).hex();

	const [rank, setRank] = useState("kingdom" as (typeof TaxonomicRanks)[0]);
	const [metricType, setMetricType] = useState("absolute" as "absolute" | "relative");
	const [averageBy, setAverageBy] = useState("lib_id");

	const [taxonomies, setTaxonomies] = useState([] as string[]);
	const [taxaColors, setTaxaColors] = useState([] as chroma.Color[]);
	const [taxonomiesFilter, setTaxonomiesFilter] = useState({} as Record<string, true>);
	const [taxaFilterGate, setTaxaFilterGate] = useState(false); //used to set default filter without retriggering effect
	const [xLabels, setXLabels] = useState([] as string[]);
	const [xLabelsFilter, setXLabelsFilter] = useState({} as Record<string, true>);

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
		if (taxaFilterGate) {
			setTaxaFilterGate(false);
		} else {
			async function doLoad() {
				if (!(averageBy !== "lib_id" && metricType === "absolute")) {
					//give control back to browser to display loading
					await new Promise((resolve) => setTimeout(resolve, 1));

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

					const uniqueColors = distinctColors({ count: rankValues.size, chromaMin: 35 });
					setTaxaColors(uniqueColors);
					const sortedRanks = Array.from(rankValues).sort();
					setTaxonomies(sortedRanks);

					let currRanks;
					let currColors;
					//only display first DEFAULT_MAX_TAXONOMIES taxonomies if the list is new
					const newTaxa = sortedRanks.length !== taxonomies.length || sortedRanks.some((r) => !taxonomies.includes(r));
					if (sortedRanks.length > DEFAULT_MAX_TAXONOMIES && newTaxa) {
						currRanks = sortedRanks.slice(0, DEFAULT_MAX_TAXONOMIES);
						currColors = uniqueColors.slice(0, DEFAULT_MAX_TAXONOMIES);

						setTaxaFilterGate(true);
						setTaxonomiesFilter(
							sortedRanks
								.slice(DEFAULT_MAX_TAXONOMIES)
								.reduce((acc, r) => ({ ...acc, [r]: true }), {} as typeof taxonomiesFilter)
						);
					} else {
						currRanks = [...sortedRanks];
						currColors = [...uniqueColors];

						if (newTaxa) {
							setTaxaFilterGate(true);
							setTaxonomiesFilter({});
						} else {
							//filter taxonomies
							for (let i = 0; i < currRanks.length; i++) {
								if (taxonomiesFilter[currRanks[i]]) {
									currRanks.splice(i, 1);
									currColors.splice(i, 1);
									i--;
								}
							}
						}
					}

					let libIds = Object.keys(libIdRankQuantities).sort();
					let averageByGroups = {} as Record<string, Library["lib_id"][]>;
					if (averageBy !== "lib_id") {
						for (const lib_id of libIds) {
							let val;
							if (userDefinedFields?.has(averageBy)) {
								if (samplesById[sampleIdsByLibId[lib_id]].userDefined) {
									val = samplesById[sampleIdsByLibId[lib_id]].userDefined![averageBy]?.toString() || "undefined";
								} else {
									val = "undefined";
								}
							} else {
								val = samplesById[sampleIdsByLibId[lib_id]][averageBy as keyof Sample]?.toString() || "undefined";
							}

							if (averageByGroups[val]) {
								averageByGroups[val].push(lib_id);
							} else {
								averageByGroups[val] = [lib_id];
							}
						}
					}
					let groupLabels = Object.keys(averageByGroups).sort();

					//filter labels
					let labels;
					if (averageBy === "lib_id") {
						setXLabels(libIds);
						libIds = libIds.filter((l) => !xLabelsFilter[l]);
						labels = libIds;
					} else {
						setXLabels(groupLabels);
						groupLabels = groupLabels.filter((l) => !xLabelsFilter[l]);
						labels = groupLabels;
					}

					setChartData({
						labels,
						datasets: currRanks.map((lev, i) => {
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
								data = libIds.map((lib_id) => ({ x: lib_id, y: libIdRankQuantities[lib_id][lev] }));
							}

							return {
								label: lev,
								data,
								borderColor: currColors[i].hex(),
								backgroundColor: currColors[i].alpha(0.8).hex(),
								borderWidth: 1,
								barThickness: "flex"
							};
						})
					});
				}

				setLoading(false);
			}

			doLoad();
		}
	}, [rank, metricType, averageBy, taxonomiesFilter, xLabelsFilter]);

	return (
		<div id="taxaBar" className="relative">
			<div className="w-full flex justify-center items-center gap-5 mb-2">
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
						{sampFields.map((f) => (
							<option key={f} value={f}>
								{f}
								{userDefinedFields?.has(f) ? " (UD)" : ""}
							</option>
						))}
					</select>
				</fieldset>

				<button className="btn mt-7" onClick={() => ref.current?.resetZoom()} disabled={loading}>
					Reset Zoom
				</button>

				<ChartCopyButton ref={ref} disabled={loading} />
			</div>

			<div className="w-full flex justify-center items-center gap-5">
				<div className="flex gap-1">
					<InfoButton
						infoText={`Selecting many ${RankPlurals[rank]} may cause lag. When changing ranks, if more than 20 values exist, only the first 20 will default to selected.`}
						type="warning"
					/>

					<Checklist
						label={RankPlurals[rank]}
						list={taxonomies}
						colorList={taxaColors}
						listFilter={taxonomiesFilter}
						setListFilter={setTaxonomiesFilter}
						sideEffect={() => setLoading(true)}
					/>
				</div>

				<Checklist
					label={`${averageBy} values`}
					list={xLabels}
					listFilter={xLabelsFilter}
					setListFilter={setXLabelsFilter}
					sideEffect={() => setLoading(true)}
				/>
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
								text: averageBy,
								color: textColor
							},
							ticks: {
								color: textColor
							},
							grid: {
								color: gridColor
							}
						},
						y: {
							stacked: true,
							beginAtZero: true,
							min: 0,
							max: metricType === "relative" ? 100 : undefined,
							title: {
								display: true,
								text: metricType === "relative" ? "Relative Abundance (%)" : "Occurrences",
								color: textColor
							},
							ticks: {
								color: textColor
							},
							grid: {
								color: gridColor
							}
						}
					}
				}}
			/>

			{loading ? <div className="absolute left-0 top-0 w-full h-full bg-black/20 rounded-md"></div> : <></>}
		</div>
	);
}
