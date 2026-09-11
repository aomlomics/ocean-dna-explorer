"use client";

import type { LibraryModel, OccurrenceModel, SampleModel } from "@/app/generated/prisma/models";
import { Bar } from "react-chartjs-2";
import { useMemo, useRef, useState, useTransition } from "react";
import distinctColors from "distinct-colors";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { RankPlurals, TaxonomicRanks } from "@/types/objects";
import ChartCopyButton from "../ChartCopyButton";
import zoomPlugin from "chartjs-plugin-zoom";
import InfoButton from "@/app/components/InfoButton";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import Checklist from "@/app/components/Checklist";
import chroma from "chroma-js";
import {
	ABUNDANCE_DEFAULT_RANK,
	type AssignsByFeatureid,
	type LibsWithSampleById,
	type TaxonomiesByName
} from "../wrappers/TaxonomyVisualize";
import type { TaxonomicRank } from "@/types/globals";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, zoomPlugin);

const DEFAULT_MAX_TAXONOMIES = 20;

//TODO: separate libraries by project_id
//TODO: paginate on averageBy
export default function TaxaBarChart({
	assignsByFeatureid,
	taxonomiesByName,
	libsWithSampleById,
	sampFields,
	userDefinedFields,
	libraryLabels
}: {
	assignsByFeatureid: AssignsByFeatureid;
	taxonomiesByName: TaxonomiesByName;
	libsWithSampleById: LibsWithSampleById;
	sampFields: string[];
	userDefinedFields?: Set<string>;
	libraryLabels: Map<LibraryModel["id"], string>;
}) {
	const ref = useRef<ChartJS<"bar", { x: string; y: number }[]>>(null);

	const [loading, startTransition] = useTransition();

	const { textColor } = useDaisyTheme();
	const gridColor = chroma(textColor).alpha(0.3).hex();

	const [rank, setRank] = useState(ABUNDANCE_DEFAULT_RANK);
	const [metricType, setMetricType] = useState("absolute" as "absolute" | "relative");
	const [averageBy, setAverageBy] = useState("lib_id");

	const [taxonomiesFilter, setTaxonomiesFilter] = useState({} as Record<string, boolean>);

	const [xLabelsFilter, setXLabelsFilter] = useState({} as Record<string, boolean>);

	const { taxonomies, taxaColors, xLabels, chartData } = useMemo(() => {
		//all values of selected rank
		const rankValues = new Set() as Set<string>;
		//the counts of each rank value per library
		const libraryRankQuantities = {} as Record<LibraryModel["id"], Record<string, OccurrenceModel["organismQuantity"]>>;
		//the counts of ALL rank values per library
		const libraryTotals = {} as Record<LibraryModel["id"], OccurrenceModel["organismQuantity"]>;

		for (const assign of Object.values(assignsByFeatureid)) {
			const rankVal = taxonomiesByName[assign.taxonomy]![rank] ?? "undefined";
			rankValues.add(rankVal);

			for (const occ of assign.Occurrences) {
				(libraryRankQuantities[occ.Library.id] ??= { [rankVal]: 0 })[rankVal]! += occ.organismQuantity;
				libraryTotals[occ.Library.id] = (libraryTotals[occ.Library.id] ?? 0) + occ.organismQuantity;
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

		const averageByGroups = {} as Record<string, LibraryModel["id"][]>;
		let visibleGroupLabels: string[] | undefined;
		let labels;
		let allXLabels;
		if (averageBy === "lib_id") {
			const compositeLibIds = Array.from(libraryLabels.values());
			labels = compositeLibIds.filter((l) => !xLabelsFilter[l]);
			allXLabels = compositeLibIds;
		} else {
			//get all unique values for averageBy
			for (const [id, lib] of libsWithSampleById.entries()) {
				let val: string;

				if (userDefinedFields?.has(averageBy)) {
					val = lib.Sample.userDefined?.[averageBy]?.toString() ?? "undefined";
				} else {
					val = lib.Sample[averageBy as keyof SampleModel]?.toString() ?? "undefined";
				}

				(averageByGroups[val] ??= []).push(id);
			}

			//TODO: sort differently depending on type of averageBy
			const groupLabels = Object.keys(averageByGroups).sort();
			visibleGroupLabels = groupLabels.filter((label) => !xLabelsFilter[label]);

			labels = visibleGroupLabels;
			allXLabels = groupLabels;
		}

		//calculate relative abundance for all libraries first
		const libraryData = Array.from(libsWithSampleById.keys()).map((id) => {
			const numId = id;
			const quants = libraryRankQuantities[numId] ?? {};

			return {
				id: numId,
				quants,
				total: libraryTotals[numId] ?? 0
			};
		});

		const datasets = currRanks.map((taxon, i) => {
			let data: { x: string; y: number }[];

			if (metricType === "relative") {
				const libData = libraryData.map((point) => ({
					libraryId: point.id,
					y: point.total ? ((point.quants[taxon] ?? 0) / point.total) * 100 : 0
				}));

				if (averageBy === "lib_id") {
					//only filter after calculating the values
					data = libData
						.filter((point) => !xLabelsFilter[libraryLabels.get(point.libraryId)!])
						.map((point) => ({
							x: libraryLabels.get(point.libraryId)!,
							y: point.y
						}));
				} else {
					//average using all libraries in each group
					const libDataById = new Map(libData.map((point) => [point.libraryId, point.y]));
					data = visibleGroupLabels!.map((group) => {
						const groupLibIds = averageByGroups[group]!;

						return {
							x: group,
							y: groupLibIds.reduce((sum, libraryId) => sum + (libDataById.get(libraryId) ?? 0), 0) / groupLibIds.length
						};
					});
				}
			} else {
				//absolute counts only work with lib_id
				data = libraryData
					.filter((point) => !xLabelsFilter[libraryLabels.get(point.id)!])
					.map((point) => ({
						x: libraryLabels.get(point.id)!,
						y: point.quants[taxon] ?? 0
					}));
			}

			return {
				label: taxon,
				data,
				borderColor: currColors[i]!.hex(),
				backgroundColor: currColors[i]!.alpha(0.8).hex(),
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
		assignsByFeatureid,
		taxonomiesByName,
		libsWithSampleById,
		rank,
		metricType,
		averageBy,
		taxonomiesFilter,
		xLabelsFilter
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
								setRank(e.target.value as TaxonomicRank);
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
