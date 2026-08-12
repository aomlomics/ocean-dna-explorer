"use client";

import { Assignment, Library, Occurrence, Sample, Taxonomy } from "@/app/generated/prisma/client";
import { Bar } from "react-chartjs-2";
import { useMemo, useRef, useState, useTransition } from "react";
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
export const DEFAULT_RANK = "kingdom" as (typeof TaxonomicRanks)[0];

//TODO: separate libraries by project_id
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
	taxonomiesById: Record<Taxonomy["id"], Record<(typeof TaxonomicRanks)[number], string | null>>;
	samplesById: Record<Sample["id"], Sample & { Libraries: { lib_id: Library["lib_id"] }[] }>;
	sampleIdsByLibId: Record<Library["lib_id"], Sample["id"]>;
	sampFields: string[];
	userDefinedFields?: Set<string>;
}) {
	const ref = useRef<ChartJS<"bar", { x: string; y: number }[]>>(null);

	const [loading, startTransition] = useTransition();

	const { textColor } = useDaisyTheme();
	const gridColor = chroma(textColor).alpha(0.3).hex();

	const [rank, setRank] = useState(DEFAULT_RANK);
	const [metricType, setMetricType] = useState<"absolute" | "relative">("absolute");
	const [averageBy, setAverageBy] = useState("lib_id");

	const [taxonomiesFilter, setTaxonomiesFilter] = useState({} as Record<string, boolean>);

	const [xLabelsFilter, setXLabelsFilter] = useState({} as Record<string, boolean>);

	const { taxonomies, taxaColors, xLabels, chartData } = useMemo(() => {
		const rankValues = new Set<string>();
		const libIdRankQuantities: Record<string, Record<string, number>> = {};

		for (const assign of assignments) {
			const occs = occsByFeatureid[assign.featureid];

			if (!occs) continue;

			let rankVal = taxonomiesById[assign.Taxonomy.id][rank] ?? "undefined";
			rankValues.add(rankVal);

			for (const occ of occs) {
				if (!libIdRankQuantities[occ.lib_id]) {
					libIdRankQuantities[occ.lib_id] = {};
				}

				libIdRankQuantities[occ.lib_id][rankVal] =
					(libIdRankQuantities[occ.lib_id][rankVal] ?? 0) + occ.organismQuantity;
			}
		}

		const sortedRanks = Array.from(rankValues).sort();

		const uniqueColors = distinctColors({
			count: sortedRanks.length,
			chromaMin: 35,
			lightMin: 35
		});

		//default to first N taxonomies
		const currRanks = sortedRanks.filter((taxon, i) => {
			if (taxonomiesFilter[taxon] !== undefined) {
				return !taxonomiesFilter[taxon];
			}

			return i < DEFAULT_MAX_TAXONOMIES;
		});
		const currColors = currRanks.map((taxon) => uniqueColors[sortedRanks.indexOf(taxon)]);
		const libIds = Object.keys(libIdRankQuantities).sort();
		const averageByGroups: Record<string, Library["lib_id"][]> = {};

		if (averageBy !== "lib_id") {
			for (const lib_id of libIds) {
				let val: string;

				if (userDefinedFields?.has(averageBy)) {
					val = samplesById[sampleIdsByLibId[lib_id]].userDefined?.[averageBy]?.toString() ?? "undefined";
				} else {
					val = samplesById[sampleIdsByLibId[lib_id]][averageBy as keyof Sample]?.toString() ?? "undefined";
				}

				(averageByGroups[val] ??= []).push(lib_id);
			}
		}

		const groupLabels = Object.keys(averageByGroups).sort();
		const allXLabels = averageBy === "lib_id" ? libIds : groupLabels;
		const visibleLibIds = libIds.filter((libId) => !xLabelsFilter[libId]);
		const visibleGroupLabels = groupLabels.filter((label) => !xLabelsFilter[label]);
		const labels = averageBy === "lib_id" ? visibleLibIds : visibleGroupLabels;

		const datasets = currRanks.map((taxon, i) => {
			let data: { x: string; y: number }[];

			if (metricType === "relative") {
				//calculate relative abundance for all libraries first
				const libData = libIds.map((lib_id) => {
					const absoluteValue = libIdRankQuantities[lib_id][taxon] ?? 0;

					const total = Object.values(libIdRankQuantities[lib_id]).reduce((sum, value) => sum + value, 0);

					return {
						x: lib_id,
						y: total ? (absoluteValue / total) * 100 : 0
					};
				});

				if (averageBy === "lib_id") {
					//only filter after calculating the values
					data = libData.filter((point) => !xLabelsFilter[point.x]);
				} else {
					//average using all libraries in each group
					data = visibleGroupLabels.map((group) => {
						const groupLibIds = averageByGroups[group];

						return {
							x: group,
							y: groupLibIds.reduce((sum, libId) => sum + libData[libIds.indexOf(libId)].y, 0) / groupLibIds.length
						};
					});
				}
			} else {
				//absolute counts only work with lib_id
				data = libIds
					.filter((libId) => !xLabelsFilter[libId])
					.map((lib_id) => ({
						x: lib_id,
						y: libIdRankQuantities[lib_id][taxon] ?? 0
					}));
			}

			return {
				label: taxon,
				data,
				borderColor: currColors[i].hex(),
				backgroundColor: currColors[i].alpha(0.8).hex(),
				borderWidth: 1,
				barThickness: "flex" as const
			};
		});

		return {
			taxonomies: sortedRanks,
			taxaColors: uniqueColors,
			xLabels: allXLabels,
			chartData: {
				labels,
				datasets
			}
		};
	}, [
		assignments,
		occsByFeatureid,
		taxonomiesById,
		samplesById,
		sampleIdsByLibId,
		rank,
		metricType,
		averageBy,
		taxonomiesFilter,
		xLabelsFilter,
		userDefinedFields
	]);

	const defaultTaxonomiesFilter = useMemo(() => {
		return Object.fromEntries(taxonomies.slice(DEFAULT_MAX_TAXONOMIES).map((taxon) => [taxon, true])) as Record<
			string,
			true
		>;
	}, [taxonomies]);

	return (
		<div className="relative p-6">
			<div className="w-full flex justify-center items-center gap-5 mb-2">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Taxonomic Rank:</legend>
					<select
						value={rank}
						onChange={(e) => {
							startTransition(() => {
								setRank(e.target.value as (typeof TaxonomicRanks)[0]);
							});
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
							startTransition(() => {
								setMetricType(e.target.value as "absolute" | "relative");
							});
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
							startTransition(() => {
								if (e.target.value !== "lib_id" && metricType === "absolute") {
									setMetricType("relative");
								}
								setAverageBy(e.target.value);
								setXLabelsFilter({});
							});
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
						text={`Selecting many ${RankPlurals[rank]} may cause lag. When changing ranks, if more than ${DEFAULT_MAX_TAXONOMIES} values exist, only the first ${DEFAULT_MAX_TAXONOMIES} will default to selected.`}
						type="warning"
					/>

					<Checklist
						label={RankPlurals[rank]}
						list={taxonomies}
						colorList={taxaColors}
						listFilter={taxonomiesFilter}
						setListFilter={setTaxonomiesFilter}
						defaultListFilter={defaultTaxonomiesFilter}
						startTransition={startTransition}
					/>
				</div>

				<Checklist
					label={`${averageBy} values`}
					list={xLabels}
					listFilter={xLabelsFilter}
					setListFilter={setXLabelsFilter}
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

			{loading && <div className="absolute left-0 top-0 w-full h-full bg-black/20 rounded-md" />}
		</div>
	);
}
