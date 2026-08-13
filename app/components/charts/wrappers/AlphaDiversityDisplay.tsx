"use client";

import { CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { AlphaDiversity, AlphaDiversityIndex, Sample } from "../../../generated/prisma/client";
import BoxWhiskerPlot, { BoxWhiskerData, BoxWhiskerDataset } from "../BoxWhiskerPlot";
import { Chart as ChartJS } from "chart.js";
import { SampleScalarFieldEnumSchema } from "@/prisma/generated/zod";
import { getZodType } from "../../../helpers/schema";
import ChartCopyButton from "../ChartCopyButton";
import { DeadValueEnum, DeadValueNumbers } from "@/types/enums";
import useDaisyTheme from "../../../hooks/useDaisyTheme";
import chroma from "chroma-js";
import Link from "next/link";
import { DbType } from "@/types/globals";
import distinctColors from "distinct-colors";
import Checklist from "../../Checklist";
import InfoButton from "../../InfoButton";
import { exploreAnalysisUrl } from "@/app/helpers/utils";

const METRIC_SEP = " | ";
const DEFAULT_MAX_HUES = 20;

export const DEFAULT_X_FIELD = "env_local_scale";
export const DEFAULT_HUE_FIELD = "";

type HueFilter = Record<string, boolean>;
type DefaultHueFilter = Record<string, true>;

type ChartResult = {
	data: BoxWhiskerData | undefined;
	hueValues: string[];
	hueColors: chroma.Color[];
	defaultHueFilter: DefaultHueFilter;
};

function getSortedValues(labels: string[], type: DbType) {
	let func: (a: string, b: string) => number;

	if (type === "float" || type === "integer") {
		func = (a, b) => parseFloat(a) - parseFloat(b);
	} else if (type === "date") {
		func = (a, b) => new Date(a).getTime() - new Date(b).getTime();
	} else {
		func = (a, b) => a.localeCompare(b);
	}

	return labels.sort((a, b) => {
		const aBad = a === "no value" || a in DeadValueEnum;
		const bBad = b === "no value" || b in DeadValueEnum;

		if (aBad && bBad) {
			return 0;
		} else if (aBad) {
			return 1;
		} else if (bBad) {
			return -1;
		}

		return func(a, b);
	});
}

type AlphaDiversityWithIndexes = (AlphaDiversity & {
	AlphaDiversityIndexes: {
		index: AlphaDiversityIndex["index"];
		Library?: {
			Sample?: Sample | null;
		} | null;
	}[];
})[];

export default function AlphaDiversityDisplay({
	alphaDiversities,
	sameAnalysis
}: {
	alphaDiversities: AlphaDiversityWithIndexes;
	sameAnalysis?: boolean;
}) {
	const { primaryColor } = useDaisyTheme();

	const chartRef = useRef<ChartJS>(null);

	const [currMetric, setCurrMetric] = useState<string | undefined>(undefined);
	const [xField, setXField] = useState(DEFAULT_X_FIELD);
	const [hueField, setHueField] = useState(DEFAULT_HUE_FIELD);
	const [hueFilter, setHueFilter] = useState<HueFilter>({});
	const [currTime, setCurrTime] = useState(() => Date.now());
	const [showPoints, setShowPoints] = useState(false);

	const { diversitiesByMetric, userDefinedFields } = useMemo(() => {
		const diversitiesByMetric = {} as Record<string, AlphaDiversityWithIndexes>;
		const userDefinedFields = new Set<string>();

		for (const ad of alphaDiversities) {
			const metric = ad.indexType + (ad.depth ? METRIC_SEP + ad.depth : "");

			if (metric in diversitiesByMetric) {
				diversitiesByMetric[metric].push(ad);
			} else {
				diversitiesByMetric[metric] = [ad];
			}

			for (const index of ad.AlphaDiversityIndexes) {
				const sample = index.Library?.Sample;

				if (sample?.userDefined) {
					Object.keys(sample.userDefined).forEach((field) => {
						userDefinedFields.add(field);
					});
				}
			}
		}

		return {
			diversitiesByMetric,
			userDefinedFields
		};
	}, [alphaDiversities]);

	// Keep the selected metric valid if the available metrics change.
	const availableMetrics = Object.keys(diversitiesByMetric);

	const effectiveCurrMetric = currMetric && currMetric in diversitiesByMetric ? currMetric : availableMetrics[0];

	function getSampleFieldValue(sample: Sample, field: string, type: string) {
		if (!effectiveCurrMetric) {
			throw new Error("Current Alpha Diversity must exist");
		}

		const value = sample[field as keyof Sample];

		if (value != null && value !== "") {
			if ((value as string | number) in DeadValueEnum) {
				if (DeadValueNumbers.includes(value as number)) {
					return DeadValueEnum[value as number];
				} else {
					return value.toString();
				}
			} else if (!userDefinedFields.has(field) && type === "date") {
				return new Date(value as string | Date).toLocaleDateString();
			} else {
				return value.toString();
			}
		}

		if (userDefinedFields.has(field) && sample.userDefined && sample.userDefined[field] != null) {
			return sample.userDefined[field];
		}

		return "no value";
	}

	// Build all chart-related data.
	const chartResult = useMemo<ChartResult>(() => {
		if (!effectiveCurrMetric) {
			return {
				data: undefined,
				hueValues: [],
				hueColors: [],
				defaultHueFilter: {}
			};
		}

		const finishedDiversities = diversitiesByMetric[effectiveCurrMetric].filter((ad) => ad.finished);

		if (!finishedDiversities.length) {
			return {
				data: undefined,
				hueValues: [],
				hueColors: [],
				defaultHueFilter: {}
			};
		}

		const xType =
			xField === "analysis_run_name" || userDefinedFields.has(xField) ? "string" : getZodType("sample", xField).type;

		let hueType: DbType | undefined;

		const hues = new Set<string>();

		const datasetsObj = {} as Record<string, number[] | Record<string, number[]>>;

		if (hueField) {
			hueType =
				hueField === "analysis_run_name" || userDefinedFields.has(hueField)
					? "string"
					: getZodType("sample", hueField).type;
		}

		for (const ad of finishedDiversities) {
			for (const i of ad.AlphaDiversityIndexes) {
				const sample = i.Library?.Sample;

				if (sample) {
					const xValue =
						xField === "analysis_run_name" ? ad.analysis_run_name : getSampleFieldValue(sample, xField, xType);

					const hueValue = hueField
						? hueField === "analysis_run_name"
							? ad.analysis_run_name
							: getSampleFieldValue(sample, hueField, hueType!)
						: undefined;

					if (hueValue) {
						hues.add(hueValue);

						const existing = datasetsObj[xValue];

						if (existing && !Array.isArray(existing)) {
							if (existing[hueValue]) {
								existing[hueValue].push(i.index);
							} else {
								existing[hueValue] = [i.index];
							}
						} else {
							datasetsObj[xValue] = {
								[hueValue]: [i.index]
							};
						}
					} else {
						const existing = datasetsObj[xValue];

						if (existing && Array.isArray(existing)) {
							existing.push(i.index);
						} else {
							datasetsObj[xValue] = [i.index];
						}
					}
				}
			}
		}

		const sortedLabels = getSortedValues(Object.keys(datasetsObj), xType);

		// No hue field.
		if (!hueField) {
			return {
				data: {
					labels: sortedLabels,
					datasets: [
						{
							data: sortedLabels.map((label) => datasetsObj[label] as number[]),
							borderColor: primaryColor,
							backgroundColor: chroma(primaryColor).alpha(0.5).hex()
						}
					]
				},
				hueValues: [],
				hueColors: [],
				defaultHueFilter: {}
			};
		}

		// Hue field selected.
		const sortedHues = getSortedValues(Array.from(hues), hueType!);

		const colors = distinctColors({
			count: sortedHues.length,
			chromaMin: 35,
			lightMin: 35
		});

		const defaultHueFilter: DefaultHueFilter =
			sortedHues.length > DEFAULT_MAX_HUES
				? sortedHues.slice(DEFAULT_MAX_HUES).reduce((acc, hue) => {
						acc[hue] = true;
						return acc;
					}, {} as DefaultHueFilter)
				: {};

		const validHueFilter = Object.keys(hueFilter).reduce((acc, hue) => {
			if (sortedHues.includes(hue)) {
				acc[hue] = hueFilter[hue];
			}

			return acc;
		}, {} as HueFilter);

		const effectiveHueFilter: HueFilter = {
			...defaultHueFilter,
			...validHueFilter
		};

		const datasets = sortedHues.reduce((acc, hue, i) => {
			if (effectiveHueFilter[hue]) {
				return acc;
			}

			acc.push({
				label: hue,
				data: sortedLabels.map((label) => {
					const values = datasetsObj[label] as Record<string, number[]>;

					return values[hue] ?? null;
				}),
				borderColor: colors[i].hex(),
				backgroundColor: colors[i].alpha(0.5).hex()
			});

			return acc;
		}, [] as BoxWhiskerDataset[]);

		return {
			data: {
				labels: sortedLabels,
				datasets
			},
			hueValues: sortedHues,
			hueColors: colors,
			defaultHueFilter
		};
	}, [effectiveCurrMetric, xField, hueField, hueFilter, primaryColor]);

	const { data, hueValues, hueColors, defaultHueFilter } = chartResult;

	useEffect(() => {
		if (!alphaDiversities.some((ad) => !ad.finished)) {
			return;
		}

		const interval = setInterval(() => {
			setCurrTime(Date.now());
		}, 1000);

		return () => clearInterval(interval);
	}, [alphaDiversities]);

	const unfinishedAnalyses = effectiveCurrMetric
		? diversitiesByMetric[effectiveCurrMetric].reduce((acc, ad) => {
				if (!ad.finished && !(ad.analysis_run_name in acc)) {
					acc.push(ad);
				}

				return acc;
			}, [] as AlphaDiversityWithIndexes)
		: undefined;

	const omit = ["id", "userDefined", "deleted_ODE", "project_id"];

	function handleMetricChange(metric: string) {
		setCurrMetric(metric);
		setHueFilter({});
	}

	function handleXFieldChange(field: string) {
		setXField(field);
		setHueFilter({});
	}

	function handleHueFieldChange(field: string) {
		setHueField(field);
		setHueFilter({});
	}

	return (
		<div className="p-6 flex flex-col gap-2">
			{effectiveCurrMetric ? (
				<>
					{alphaDiversities.some((ad) => ad.finished) ? (
						<>
							<div className="w-full grid grid-cols-3 gap-5 items-center">
								<fieldset className="fieldset justify-self-end">
									<legend className="fieldset-legend">Metric:</legend>

									<select
										value={effectiveCurrMetric}
										onChange={(e) => handleMetricChange(e.currentTarget.value)}
										className="select"
									>
										{availableMetrics.map((metric) => (
											<option key={metric} value={metric}>
												{`${metric.split(METRIC_SEP)[0]}${
													metric.split(METRIC_SEP)[1] ? ` (${metric.split(METRIC_SEP)[1]})` : ""
												}`}
											</option>
										))}
									</select>
								</fieldset>

								<div className="grid grid-cols-[1fr_auto_1fr] gap-3 justify-self-center items-center">
									<fieldset className="fieldset justify-self-end">
										<legend className="fieldset-legend">X Field:</legend>

										<select
											value={xField}
											onChange={(e) => handleXFieldChange(e.currentTarget.value)}
											className="select"
										>
											{sameAnalysis || hueField === "analysis_run_name" ? <></> : <option>analysis_run_name</option>}

											{SampleScalarFieldEnumSchema.options.reduce((acc, f) => {
												if (!omit.includes(f) && f !== hueField) {
													acc.push(<option key={f}>{f}</option>);
												}

												return acc;
											}, [] as ReactNode[])}

											{Array.from(userDefinedFields).map((f) => (
												<option key={f} value={f}>
													{f} (UD)
												</option>
											))}
										</select>
									</fieldset>

									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										xmlns="http://www.w3.org/2000/svg"
										className={`w-8 h-8 mt-7 justify-self-center${
											hueField ? " text-primary cursor-pointer" : " text-primary/40"
										}`}
										onClick={() => {
											if (hueField) {
												const oldXField = xField;

												handleXFieldChange(hueField);
												handleHueFieldChange(oldXField);
											}
										}}
									>
										<path fill="currentColor" d="M21 7.5L8 7.5M21 7.5L16.6667 3M21 7.5L16.6667 12" />
										<path fill="currentColor" d="M4 16.5L17 16.5M4 16.5L8.33333 21M4 16.5L8.33333 12" />
									</svg>

									<fieldset className="fieldset justify-self-start">
										<legend className="fieldset-legend">Hue Field:</legend>

										<select
											value={hueField}
											onChange={(e) => handleHueFieldChange(e.currentTarget.value)}
											className="select"
										>
											<option value="">No hue</option>

											{sameAnalysis || xField === "analysis_run_name" ? <></> : <option>analysis_run_name</option>}

											{SampleScalarFieldEnumSchema.options.reduce((acc, f) => {
												if (!omit.includes(f) && f !== xField) {
													acc.push(<option key={f}>{f}</option>);
												}

												return acc;
											}, [] as ReactNode[])}

											{Array.from(userDefinedFields).map((f) => (
												<option key={f} value={f}>
													{f} (UD)
												</option>
											))}
										</select>
									</fieldset>
								</div>

								<ChartCopyButton ref={chartRef} className="justify-self-start" />
							</div>

							<div className="w-full flex justify-center items-center gap-5">
								<fieldset className="fieldset">
									<label className="label select-none">
										<input
											type="checkbox"
											checked={showPoints}
											onChange={(e) => setShowPoints(e.currentTarget.checked)}
											className="checkbox"
										/>
										Show Points
									</label>
								</fieldset>

								<div className="flex gap-1">
									<InfoButton
										text={`Selecting many ${
											hueField ? hueField + " " : ""
										}values may cause lag. When changing hue field, if more than ${DEFAULT_MAX_HUES} values exist, only the first ${DEFAULT_MAX_HUES} will default to selected.`}
										type="warning"
									/>

									<Checklist
										label={`${hueField || "No hue"} values`}
										list={hueValues}
										colorList={hueColors}
										listFilter={hueFilter}
										setListFilter={setHueFilter}
										defaultListFilter={defaultHueFilter}
										disabled={!hueField}
									/>
								</div>
							</div>

							{data ? (
								<BoxWhiskerPlot
									data={data}
									ref={chartRef}
									title={`${effectiveCurrMetric.split(METRIC_SEP)[0].slice(0, 1).toUpperCase()}${effectiveCurrMetric
										.split(METRIC_SEP)[0]
										.slice(1)} Alpha Diversity${
										effectiveCurrMetric.split(METRIC_SEP)[1]
											? " at " + effectiveCurrMetric.split(METRIC_SEP)[1] + " depth"
											: ""
									}`}
									xField={xField}
									yField="Index"
									legend={hueField}
									showPoints={showPoints}
								/>
							) : (
								<div className="aspect-5/2">loading...</div>
							)}
						</>
					) : (
						<></>
					)}

					{unfinishedAnalyses?.map((ad) => {
						const timeSinceStarted = currTime - ad.dateCalculated.getTime();

						return (
							<div key={ad.analysis_run_name} className="flex flex-col justify-center items-center pt-4">
								<span>
									Calculating for{" "}
									<Link
										className="link link-primary link-hover"
										href={exploreAnalysisUrl(ad.project_id, ad.analysis_run_name)}
									>
										{ad.project_id}: {ad.analysis_run_name}
									</Link>
									...
								</span>

								<div className="grid grid-flow-col gap-5 text-center auto-cols-max">
									{timeSinceStarted >= 86400000 ? (
										<div className="flex flex-col">
											<span className="countdown font-mono text-5xl">
												<span
													style={
														{
															"--value": Math.floor(timeSinceStarted / 86400000)
														} as CSSProperties
													}
													aria-live="polite"
												></span>
											</span>
											days
										</div>
									) : (
										<></>
									)}

									{timeSinceStarted >= 3600000 ? (
										<div className="flex flex-col">
											<span className="countdown font-mono text-5xl">
												<span
													style={
														{
															"--value": Math.floor((timeSinceStarted / 3600000) % 24)
														} as CSSProperties
													}
													aria-live="polite"
												></span>
											</span>
											hours
										</div>
									) : (
										<></>
									)}

									{timeSinceStarted >= 60000 ? (
										<div className="flex flex-col">
											<span className="countdown font-mono text-5xl">
												<span
													style={
														{
															"--value": Math.floor((timeSinceStarted / 60000) % 60),
															"--digits": 2
														} as CSSProperties
													}
													aria-live="polite"
												></span>
											</span>
											min
										</div>
									) : (
										<></>
									)}

									<div className="flex flex-col">
										<span className="countdown font-mono text-5xl">
											<span
												style={
													{
														"--value": Math.floor((timeSinceStarted / 1000) % 60),
														"--digits": 2
													} as CSSProperties
												}
												aria-live="polite"
											></span>
										</span>
										sec
									</div>
								</div>
							</div>
						);
					})}
				</>
			) : (
				<div className="aspect-5/2">No Alpha Diversities available.</div>
			)}
		</div>
	);
}
