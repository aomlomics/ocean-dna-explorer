"use client";

import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import { AlphaDiversity, AlphaDiversityIndex, Sample } from "../../../generated/prisma/client";
import BoxWhiskerPlot from "../BoxWhiskerPlot";
import { Chart as ChartJS, ChartData } from "chart.js";
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
import { exploreAnalysisUrl, getRandomKey } from "@/app/helpers/utils";

const METRIC_SEP = " | ";
const DEFAULT_MAX_HUES = 20;
export const DEFAULT_X_FIELD = "env_local_scale";
export const DEFAULT_HUE_FIELD = "";

function getSortedValues(labels: string[], type: DbType) {
	let func;
	if (type === "float" || type === "integer") {
		func = (a: string, b: string) => parseFloat(a) - parseFloat(b);
	} else if (type === "date") {
		func = (a: string, b: string) => new Date(a).getTime() - new Date(b).getTime();
	} else {
		func = (a: string, b: string) => a.localeCompare(b);
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

export default function AlphaDiversityDisplay({
	alphaDiversities,
	sameAnalysis
}: {
	alphaDiversities: (AlphaDiversity & {
		AlphaDiversityIndexes: {
			index: AlphaDiversityIndex["index"];
			Library?: {
				Sample?: Sample | null;
			} | null;
		}[];
	})[];
	sameAnalysis?: boolean;
}) {
	const { primaryColor } = useDaisyTheme();

	const chartRef = useRef<ChartJS>(null);
	//state variable to trigger plot re-render
	const [chartKey, setChartKey] = useState("0");

	const diversitiesByMetric = {} as Record<string, typeof alphaDiversities>;
	const userDefinedFields = new Set() as Set<string>;
	for (const ad of alphaDiversities) {
		//index type
		const metric = ad.indexType + (ad.depth ? METRIC_SEP + ad.depth : "");
		if (metric in diversitiesByMetric) {
			diversitiesByMetric[metric].push(ad);
		} else {
			diversitiesByMetric[metric] = [ad];
		}

		//user defined
		for (const index of ad.AlphaDiversityIndexes) {
			const sample = index.Library?.Sample;
			if (sample?.userDefined) {
				Object.keys(sample.userDefined).forEach(userDefinedFields.add, userDefinedFields);
			}
		}
	}
	const [currMetric, setCurrMetric] = useState(
		Object.keys(diversitiesByMetric)[0] as AlphaDiversity["indexType"] | undefined
	);

	const [xField, setXField] = useState(DEFAULT_X_FIELD);
	const [hueField, setHueField] = useState(DEFAULT_HUE_FIELD);
	const [hueValues, setHueValues] = useState([] as string[]);
	const [hueColors, setHueColors] = useState([] as chroma.Color[]);
	const [hueFilter, setHueFilter] = useState({} as Record<string, true>);
	const [hueFilterGate, setHueFilterGate] = useState(false); //used to set default filter without retriggering effect

	const [data, setData] = useState(undefined as ChartData | undefined);

	const [currTime, setCurrTime] = useState(0);

	const [showPoints, setShowPoints] = useState(false);

	function getSampleFieldValue(sample: Sample, field: string, type: string) {
		if (!currMetric) {
			throw new Error("Current Alpha Diversity must exist");
		}

		if (sample[field as keyof Sample] != null && sample[field as keyof Sample] !== "") {
			const keyField = field as keyof Sample;
			//value exists
			if ((sample[keyField] as string | number) in DeadValueEnum) {
				//dead value
				if (DeadValueNumbers.includes(sample[keyField] as number)) {
					return DeadValueEnum[sample[keyField] as number];
				} else {
					return sample[keyField]!.toString();
				}
			} else if (!userDefinedFields.has(field) && type === "date") {
				//date
				return new Date(sample[keyField] as string | Date).toLocaleDateString();
			} else {
				//default
				return sample[keyField]!.toString();
			}
		} else {
			//value is user defined, or does not exist
			if (userDefinedFields.has(field) && sample.userDefined && sample.userDefined[field] != null) {
				//user defined and exists
				return sample.userDefined[field];
			} else {
				//default
				return "no value";
			}
		}
	}

	function rerenderChart() {
		//random value to trigger plot re-render
		setChartKey(getRandomKey());
	}

	useEffect(() => {
		if (currMetric) {
			if (hueFilterGate) {
				setHueFilterGate(false);
			} else {
				const finishedDiversities = diversitiesByMetric[currMetric].filter((ad) => ad.finished);
				if (finishedDiversities.length) {
					const xType =
						xField === "analysis_run_name" || userDefinedFields.has(xField)
							? "string"
							: getZodType("sample", xField).type;

					let hueType;
					let hues;
					let datasetsObj;
					if (hueField) {
						hueType =
							hueField === "analysis_run_name" || userDefinedFields.has(hueField)
								? "string"
								: getZodType("sample", hueField).type;
						hues = new Set() as Set<string>;
						datasetsObj = {} as Record<string, Record<string, number[]>>;
					} else {
						datasetsObj = {} as Record<string, number[]>;
					}

					for (const ad of finishedDiversities) {
						for (const i of ad.AlphaDiversityIndexes) {
							const sample = i.Library?.Sample;
							if (!sample) {
								continue;
							}

							//get string representation of values
							const xValue =
								xField === "analysis_run_name" ? ad.analysis_run_name : getSampleFieldValue(sample, xField, xType);
							let hueValue;
							if (hueField) {
								hueValue =
									hueField === "analysis_run_name"
										? ad.analysis_run_name
										: getSampleFieldValue(sample, hueField, hueType!);
							}

							if (datasetsObj[xValue]) {
								if (hueValue) {
									hues!.add(hueValue);

									const obj = datasetsObj[xValue] as Record<string, number[]>;
									if (obj[hueValue]) {
										obj[hueValue].push(i.index);
									} else {
										obj[hueValue] = [i.index];
									}
								} else {
									(datasetsObj[xValue] as number[]).push(i.index);
								}
							} else {
								if (hueValue) {
									hues!.add(hueValue);
									datasetsObj[xValue] = { [hueValue]: [i.index] };
								} else {
									datasetsObj[xValue] = [i.index];
								}
							}
						}
					}

					//sort data by label and hue
					const sortedLabels = getSortedValues(Object.keys(datasetsObj), xType);
					let sortedDatasets;
					if (hueField) {
						const sortedHues = getSortedValues(Array.from(hues!), hueType!);
						const colors = distinctColors({ count: sortedHues.length, chromaMin: 35, lightMin: 35 });
						setHueValues(sortedHues);
						setHueColors(colors);

						let currFilter = hueFilter;
						if (sortedHues.length !== hueValues.length || sortedHues.some((h) => !hueValues.includes(h))) {
							//new list of hues
							if (sortedHues.length > DEFAULT_MAX_HUES) {
								currFilter = sortedHues
									.slice(DEFAULT_MAX_HUES)
									.reduce((acc, r) => ({ ...acc, [r]: true }), {} as typeof hueFilter);
								setHueFilter(currFilter);
							} else {
								setHueFilter({});
							}
							setHueFilterGate(true);
						}

						sortedDatasets = sortedHues.reduce(
							(acc, h, i) => {
								if (!(h in currFilter)) {
									acc.push({
										label: h,
										data: sortedLabels.map((l) => (datasetsObj[l] as Record<string, number[]>)[h]),
										borderColor: colors[i].hex(),
										backgroundColor: colors[i].alpha(0.5).hex()
									});
								}

								return acc;
							},
							[] as { label: string; data: number[][]; borderColor: string; backgroundColor: string }[]
						);
					} else {
						setHueValues([]);
						setHueFilter({});
						setHueFilterGate(true);

						sortedDatasets = [
							{
								data: sortedLabels.map((l) => datasetsObj[l] as number[]),
								borderColor: primaryColor,
								backgroundColor: chroma(primaryColor).alpha(0.5).hex()
							}
						];
					}

					setData({
						labels: sortedLabels,
						datasets: sortedDatasets
					});
					rerenderChart();
				}
			}
		}
	}, [currMetric, xField, hueField, hueFilter]);

	useEffect(() => {
		if (alphaDiversities.some((ad) => !ad.finished)) {
			setCurrTime(Date.now());
			const interval = setInterval(() => setCurrTime((prev) => prev + 1000), 1000);

			return () => clearInterval(interval);
		}
	}, []);

	useEffect(() => {
		if (data && !hueField) {
			setData({
				labels: data.labels,
				datasets: data.datasets.map((ds) => ({
					label: ds.label,
					data: ds.data,
					borderColor: primaryColor,
					backgroundColor: chroma(primaryColor).alpha(0.5).hex()
				}))
			});
			rerenderChart();
		}
	}, [primaryColor]);

	const unfinishedAnalyses = currMetric
		? diversitiesByMetric[currMetric].reduce(
				(acc, ad) => {
					if (!ad.finished && !(ad.analysis_run_name in acc)) {
						acc.push(ad);
					}

					return acc;
				},
				[] as (typeof diversitiesByMetric)[typeof currMetric]
			)
		: undefined;
	const omit = ["id", "userDefined", "deleted_ODE", "project_id"];
	return (
		<div className="p-6 flex flex-col gap-2">
			{currMetric ? (
				<>
					{alphaDiversities.some((ad) => ad.finished) ? (
						<>
							<div className="w-full grid grid-cols-3 gap-5 items-center">
								<fieldset className="fieldset justify-self-end">
									<legend className="fieldset-legend">Metric:</legend>
									<select value={currMetric} onChange={(e) => setCurrMetric(e.currentTarget.value)} className="select">
										{Object.keys(diversitiesByMetric).map((metric) => (
											<option key={metric} value={metric}>
												{`${metric.split(METRIC_SEP)[0]}${metric.split(METRIC_SEP)[1] ? ` (${metric.split(METRIC_SEP)[1]})` : ""}`}
											</option>
										))}
									</select>
								</fieldset>

								<div className="grid grid-cols-[1fr_auto_1fr] gap-3 justify-self-center items-center">
									<fieldset className="fieldset justify-self-end">
										<legend className="fieldset-legend">X Field:</legend>
										<select value={xField} onChange={(e) => setXField(e.currentTarget.value)} className="select">
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
										className={`w-8 h-8 mt-7 justify-self-center${hueField ? " text-primary cursor-pointer" : " text-primary/40"}`}
										onClick={() => {
											if (hueField) {
												setXField(hueField);
												setHueField(xField);
											}
										}}
									>
										<path fill="currentColor" d="M21 7.5L8 7.5M21 7.5L16.6667 3M21 7.5L16.6667 12" />
										<path fill="currentColor" d="M4 16.5L17 16.5M4 16.5L8.33333 21M4 16.5L8.33333 12" />
									</svg>

									<fieldset className="fieldset justify-self-start">
										<legend className="fieldset-legend">Hue Field:</legend>
										<select value={hueField} onChange={(e) => setHueField(e.currentTarget.value)} className="select">
											<option value={""}>No hue</option>
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
											onChange={(e) => {
												setShowPoints(e.currentTarget.checked);
												rerenderChart();
											}}
											className="checkbox"
										/>
										Show Points
									</label>
								</fieldset>

								<div className="flex gap-1">
									<InfoButton
										text={`Selecting many ${hueField ? hueField + " " : ""}values may cause lag. When changing hue field, if more than ${DEFAULT_MAX_HUES} values exist, only the first ${DEFAULT_MAX_HUES} will default to selected.`}
										type="warning"
									/>

									<Checklist
										label={`${hueField || "No hue"} values`}
										list={hueValues}
										colorList={hueColors}
										listFilter={hueFilter}
										setListFilter={setHueFilter}
										disabled={!hueField}
									/>
								</div>
							</div>

							{data ? (
								<BoxWhiskerPlot
									key={chartKey}
									data={data}
									ref={chartRef}
									title={`${currMetric.split(METRIC_SEP)[0].slice(0, 1).toUpperCase() + currMetric.split(METRIC_SEP)[0].slice(1)} Alpha Diversity${currMetric.split(METRIC_SEP)[1] ? " at " + currMetric.split(METRIC_SEP)[1] + " depth" : ""}`}
									xField={xField}
									yField={"Index"}
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

					{unfinishedAnalyses!.map((ad) => {
						const timeSinceStarted = currTime - ad.dateCalculated.getTime();

						return (
							<div className="flex flex-col justify-center items-center pt-4">
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
													style={{ "--value": Math.floor(timeSinceStarted / 86400000) } as CSSProperties}
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
													style={{ "--value": Math.floor((timeSinceStarted / 3600000) % 24) } as CSSProperties}
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
														{ "--value": Math.floor((timeSinceStarted / 60000) % 60), "--digits": 2 } as CSSProperties
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
													{ "--value": Math.floor((timeSinceStarted / 1000) % 60), "--digits": 2 } as CSSProperties
												}
												aria-live="polite"
											></span>
										</span>
										sec
									</div>
								</div>
							</div>
						);
					}, [] as ReactNode[])}
				</>
			) : (
				<div className="aspect-5/2">No Alpha Diversities available.</div>
			)}
		</div>
	);
}
