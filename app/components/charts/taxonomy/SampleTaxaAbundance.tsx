"use client";

import type { SampleModel } from "@/app/generated/prisma/models/Sample";
import { useMemo, useRef, useState, useTransition } from "react";
import { Scatter } from "react-chartjs-2";
import {
	Chart as ChartJS,
	TimeScale,
	LinearScale,
	PointElement,
	Title,
	Tooltip,
	Legend,
	ScatterController
} from "chart.js";
import "chartjs-adapter-date-fns";
import zoomPlugin from "chartjs-plugin-zoom";
import ChartCopyButton from "../ChartCopyButton";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import chroma from "chroma-js";
import {
	ABUNDANCE_DEFAULT_RANK,
	SAMPLE_ABUNDANCE_DEFAULT_FIELD,
	SAMPLE_ABUNDANCE_DEFAULT_LEGEND_FIELD,
	type AssignsWithOccs,
	type LibsWithSampleById,
	type TaxonomiesByName
} from "../wrappers/TaxonomyVisualize";
import type { TaxonomicRank } from "@/types/globals";
import { getZodType } from "@/app/helpers/schema";
import type { LibraryModel } from "@/app/generated/prisma/models";
import { DeadValueEnum } from "@/types/enums";
import distinctColors from "distinct-colors";

ChartJS.register(TimeScale, LinearScale, PointElement, ScatterController, Title, Tooltip, Legend, zoomPlugin);

type SamplePoint = { x: number | Date; y: number; samp_name: SampleModel["samp_name"] };

const POINT_STYLES = {
	borderWidth: 1,
	pointRadius: 5,
	pointHoverRadius: 8
};

type DataPoint = {
	label: string;
	data: SamplePoint[];
	borderColor: string;
	backgroundColor: string;
} & typeof POINT_STYLES;

//TODO: style dates in legend properly (options.plugins.legend.labels.generateLabels)
export default function SampleTaxaAbundance({
	assignsWithOccs,
	taxonomiesByName,
	libsWithSampleById,
	sampFields,
	sampNumericFields,
	userDefinedFields,
	taxaRanksWithData
}: {
	assignsWithOccs: AssignsWithOccs;
	taxonomiesByName: TaxonomiesByName;
	libsWithSampleById: LibsWithSampleById;
	sampFields: string[];
	sampNumericFields: string[];
	userDefinedFields: Set<string>;
	taxaRanksWithData: TaxonomicRank[];
}) {
	const ref = useRef<ChartJS<"scatter", SamplePoint[]>>(null);

	const { textColor } = useDaisyTheme();
	const gridColor = chroma(textColor).alpha(0.3).hex();

	const [loading, startTransition] = useTransition();

	const [xReverse, setXReverse] = useState(false);
	const libsWithSample = Object.values(libsWithSampleById);
	const [xField, setXField] = useState(() =>
		libsWithSample.some((lib) => lib.Sample[SAMPLE_ABUNDANCE_DEFAULT_FIELD] != null)
			? SAMPLE_ABUNDANCE_DEFAULT_FIELD
			: sampFields.find(
					(f) => f !== SAMPLE_ABUNDANCE_DEFAULT_FIELD && libsWithSample.some((lib) => lib.Sample[f] != null)
				)!
	);
	const [legendField, setLegendField] = useState(SAMPLE_ABUNDANCE_DEFAULT_LEGEND_FIELD);
	const [abundanceRank, setAbundanceRank] = useState(ABUNDANCE_DEFAULT_RANK);

	//values of currently selected taxonomic rank
	const currentRankValues = useMemo(
		() =>
			Array.from(
				Object.values(taxonomiesByName).reduce((acc, taxa) => {
					if (taxa[abundanceRank]) acc.add(taxa[abundanceRank]);
					return acc;
				}, new Set() as Set<string>)
			),
		[taxonomiesByName, abundanceRank]
	);

	//selected taxonomic rank value
	const [abundanceSelection, setAbundanceSelection] = useState<{
		rank: TaxonomicRank;
		value: string;
	}>({
		rank: ABUNDANCE_DEFAULT_RANK,
		value: currentRankValues[0] ?? ""
	});
	//actual value of selected taxonomy, which "resets" when a new rank is selected
	const abundanceValue =
		abundanceSelection.rank === abundanceRank ? abundanceSelection.value : (currentRankValues[0] ?? "");

	const chartInfo = useMemo(() => {
		const totalAbundanceByLibrary = {} as Record<LibraryModel["id"], number>;
		const selectedAbundanceByLibrary = {} as Record<LibraryModel["id"], number>;

		for (const assign of assignsWithOccs) {
			for (const occ of assign.Occurrences) {
				totalAbundanceByLibrary[occ.Library.id] = (totalAbundanceByLibrary[occ.Library.id] ?? 0) + occ.organismQuantity;

				if (taxonomiesByName[assign.taxonomy]?.[abundanceRank] === abundanceValue) {
					selectedAbundanceByLibrary[occ.Library.id] =
						(selectedAbundanceByLibrary[occ.Library.id] ?? 0) + occ.organismQuantity;
				}
			}
		}

		const xType = getFieldType(xField);

		const datasets = {} as Record<
			string,
			Omit<DataPoint, "borderColor" | "backgroundColor"> & {
				borderColor?: string;
				backgroundColor?: string;
			}
		>;

		const xValues: number[] = [];

		for (const [libraryId, lib] of libsWithSampleById) {
			const totalAbundance = totalAbundanceByLibrary[libraryId];

			if (totalAbundance) {
				let x: number | Date | null = null;

				if (userDefinedFields.has(xField)) {
					const val = lib.Sample.userDefined?.[xField];

					if (val != null) {
						x = xType === "number" ? Number(val) : new Date(val);
					}
				} else {
					x = lib.Sample[xField as keyof SampleModel] as SamplePoint["x"];
				}

				if (
					x !== null &&
					(typeof x === "number"
						? Number.isFinite(x) && !(x in DeadValueEnum)
						: Number.isFinite(x.getTime()) && !(x.getTime() in DeadValueEnum))
				) {
					let legendValue = null as string | number | null;

					if (userDefinedFields.has(legendField)) {
						legendValue = lib.Sample.userDefined?.[legendField] ?? null;
					} else {
						legendValue = lib.Sample[legendField as keyof SampleModel] as string | number | null;
					}

					if (legendValue != null && legendValue !== "" && !(legendValue in DeadValueEnum)) {
						const label = legendValue.toString();

						(datasets[label] ??= {
							label,
							data: [],
							...POINT_STYLES
						}).data.push({
							x,
							y: ((selectedAbundanceByLibrary[libraryId] ?? 0) / totalAbundance) * 100,
							samp_name: lib.Sample.samp_name
						});

						xValues.push(x instanceof Date ? x.getTime() : x);
					}
				}
			}
		}

		const tempDatasets = Object.values(datasets);

		distinctColors({
			count: tempDatasets.length,
			chromaMin: 35,
			lightMin: 35
		}).forEach((color, i) => {
			tempDatasets[i]!.borderColor = color.hex();
			tempDatasets[i]!.backgroundColor = color.alpha(0.5).hex();
		});

		const tempXMin = Math.min(...xValues);
		const tempXMax = Math.max(...xValues);
		const rangeBuffer = (tempXMax - tempXMin) / 20;

		return {
			data: {
				datasets: tempDatasets as DataPoint[]
			},
			xType,
			xMin: tempXMin - rangeBuffer,
			xMax: tempXMax + rangeBuffer
		};
	}, [
		xField,
		legendField,
		abundanceRank,
		abundanceValue,
		assignsWithOccs,
		taxonomiesByName,
		libsWithSampleById,
		userDefinedFields
	]);

	function getFieldType(field: string) {
		if (userDefinedFields.has(field)) {
			let tempType = "date" as "number" | "date";

			for (const lib of Object.values(libsWithSampleById)) {
				if (
					lib.Sample.userDefined &&
					lib.Sample.userDefined[field] != null &&
					lib.Sample.userDefined[field].trim() !== "" &&
					Number.isFinite(Number(lib.Sample.userDefined[field]))
				) {
					tempType = "number";
					break;
				}
			}

			return tempType;
		} else {
			const type = getZodType("sample", field).type;

			if (type === "integer" || type === "float") {
				return "number";
			} else {
				return "date";
			}
		}
	}

	return (
		<div className="relative p-6">
			<div className="w-full flex justify-center items-center gap-5">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Taxonomic Rank:</legend>
					<select
						value={abundanceRank}
						onChange={(e) => startTransition(() => setAbundanceRank(e.currentTarget.value as TaxonomicRank))}
						className="select"
						disabled={loading}
					>
						{taxaRanksWithData.map((rank) => (
							<option key={rank}>{rank}</option>
						))}
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Taxonomic Value:</legend>
					<select
						value={abundanceValue}
						onChange={(e) =>
							startTransition(() =>
								setAbundanceSelection({
									rank: abundanceRank,
									value: e.currentTarget.value
								})
							)
						}
						className="select"
						disabled={loading}
					>
						{currentRankValues.map((val) => (
							<option key={val}>{val}</option>
						))}
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend w-full flex justify-between gap-2">
						<span>X-Axis:</span>
						<label className="label select-none">
							Reverse
							<input
								className="checkbox checkbox-sm"
								type="checkbox"
								checked={xReverse}
								onChange={(e) => setXReverse(e.currentTarget.checked)}
								disabled={loading}
							/>
						</label>
					</legend>
					<select
						value={xField}
						onChange={(e) => startTransition(() => setXField(e.currentTarget.value as string))}
						className="select"
						disabled={loading}
					>
						{sampNumericFields
							.filter((f) => f !== legendField)
							.map((f) => (
								<option key={f} value={f}>
									{f}
									{userDefinedFields?.has(f) ? " (UD)" : ""}
								</option>
							))}
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Color points by:</legend>
					<select
						value={legendField}
						onChange={(e) => startTransition(() => setLegendField(e.currentTarget.value as keyof SampleModel))}
						className="select"
						disabled={loading}
					>
						{sampFields
							.filter((f) => f !== xField)
							.map((f) => (
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

			<Scatter
				ref={ref}
				data={chartInfo.data}
				options={{
					responsive: true,
					plugins: {
						legend: {
							display: true,
							position: "top",
							labels: {
								color: textColor
							}
						},
						title: {
							display: true,
							text: `Relative Abundance of the ${abundanceRank} ${abundanceValue} vs. Sample ${xField}`,
							color: textColor
						},
						tooltip: {
							callbacks: {
								afterLabel: (ctx) => (ctx.raw as SamplePoint).samp_name
							}
						},
						zoom: {
							zoom: {
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
								modifierKey: "shift"
							}
						}
					},
					scales: {
						x: {
							...(chartInfo.xType === "date"
								? {
										type: "time",
										time: {
											unit: "day",
											tooltipFormat: "yyyy MMM dd",
											displayFormats: {
												day: "yyyy MMM dd"
											}
										}
									}
								: {}),
							title: {
								display: true,
								text: xField,
								color: textColor
							},
							ticks: {
								color: textColor
							},
							grid: {
								color: gridColor
							},
							min: chartInfo.xMin,
							max: chartInfo.xMax,
							reverse: xReverse
						},
						y: {
							title: {
								display: true,
								text: `Relative Abundance`,
								color: textColor
							},
							ticks: {
								color: textColor,
								callback: (value) => `${value}%`
							},
							grid: {
								color: gridColor
							},
							min: -5,
							max: 105
						}
					}
				}}
			/>

			{loading ? <div className="absolute left-0 top-0 w-full h-full bg-black/20 rounded-md"></div> : <></>}
		</div>
	);
}
