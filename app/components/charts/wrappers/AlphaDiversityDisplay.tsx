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

const METRIC_SEP = " | ";

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

function getChartKey() {
	//random value to trigger plot re-render
	return (Math.random() + 1).toString(36).substring(7);
}

//TODO: merge alphaDiversities from different analyses together
export default function AlphaDiversityDisplay({
	alphaDiversities,
	sameAnalysis
}: {
	alphaDiversities: (AlphaDiversity & {
		AlphaDiversityIndexes: {
			index: AlphaDiversityIndex["index"];
			Library: {
				Sample: Sample;
			};
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
			if (index.Library.Sample.userDefined) {
				Object.keys(index.Library.Sample.userDefined).forEach(userDefinedFields.add, userDefinedFields);
			}
		}
	}
	const [currMetric, setCurrMetric] = useState(
		Object.keys(diversitiesByMetric)[0] as AlphaDiversity["indexType"] | undefined
	);
	const [xField, setXField] = useState("env_local_scale");
	const [hueField, setHueField] = useState("");
	const [hoveredLegend, setHoveredLegend] = useState(undefined as string | undefined);
	const [data, setData] = useState(undefined as ChartData | undefined);

	const [currTime, setCurrTime] = useState(new Date().getTime());

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

	useEffect(() => {
		if (currMetric) {
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
						//get string representation of values
						const xValue =
							xField === "analysis_run_name"
								? ad.analysis_run_name
								: getSampleFieldValue(i.Library.Sample, xField, xType);
						let hueValue;
						if (hueField) {
							hueValue =
								hueField === "analysis_run_name"
									? ad.analysis_run_name
									: getSampleFieldValue(i.Library.Sample, hueField, hueType!);
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
					const colors = distinctColors({ count: hues!.size, chromaMin: 35 });
					sortedDatasets = getSortedValues(Array.from(hues!), hueType!).map((h, i) => ({
						label: h,
						data: sortedLabels.map((l) => (datasetsObj[l] as Record<string, number[]>)[h]),
						borderColor: colors[i].hex(),
						backgroundColor: colors[i].alpha(0.5).hex()
					}));
				} else {
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
				setChartKey(getChartKey());
			}
		}
	}, [currMetric, xField, hueField]);

	useEffect(() => {
		if (alphaDiversities.some((ad) => !ad.finished)) {
			const interval = setInterval(() => setCurrTime((prev) => prev + 1000), 1000);

			return () => clearInterval(interval);
		}
	}, []);

	useEffect(() => {
		if (data && data.datasets.length > 1) {
			if (hoveredLegend) {
				//dim every color except hovered legend color
				setData({
					labels: data.labels,
					datasets: data.datasets.map((ds) => ({
						...ds,
						borderColor:
							ds.label === hoveredLegend
								? chroma(ds.borderColor as string)
										.alpha(1)
										.hex()
								: chroma(ds.borderColor as string)
										.alpha(0.1)
										.hex(),
						backgroundColor:
							ds.label === hoveredLegend
								? chroma(ds.borderColor as string)
										.alpha(0.5)
										.hex()
								: "#00000000"
					}))
				});
			} else if (data.datasets.some((set) => set.backgroundColor === "#00000000")) {
				//return all colors to normal
				setData({
					labels: data.labels,
					datasets: data.datasets.map((ds) => ({
						...ds,
						borderColor: chroma(ds.borderColor as string)
							.alpha(1)
							.hex(),
						backgroundColor: chroma(ds.borderColor as string)
							.alpha(0.5)
							.hex()
					}))
				});
			}
			setChartKey(getChartKey());
		}
	}, [hoveredLegend]);

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
			setChartKey(getChartKey());
		}
	}, [primaryColor]);

	const unfinishedAnalyses = currMetric
		? diversitiesByMetric[currMetric].reduce(
				(acc, ad) => {
					if (!ad.finished && !(ad.analysis_run_name in acc)) {
						acc[ad.analysis_run_name] = ad.dateCalculated.getTime();
					}

					return acc;
				},
				{} as Record<AlphaDiversity["analysis_run_name"], number>
			)
		: undefined;
	const omit = ["id", "userDefined", "deleted_ODE", "project_id"];
	return (
		<div className="p-6">
			{currMetric ? (
				<>
					{alphaDiversities.some((ad) => ad.finished) ? (
						<>
							<div className="w-full flex justify-center items-center gap-5">
								<fieldset className="fieldset">
									<legend className="fieldset-legend">Metric:</legend>
									<select value={currMetric} onChange={(e) => setCurrMetric(e.currentTarget.value)} className="select">
										{Object.keys(diversitiesByMetric).map((metric) => (
											<option key={metric} value={metric}>
												{`${metric.split(METRIC_SEP)[0]}${metric.split(METRIC_SEP)[1] ? ` (${metric.split(METRIC_SEP)[1]})` : ""}`}
											</option>
										))}
									</select>
								</fieldset>

								<fieldset className="fieldset">
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
									className={`w-8 h-8 mt-7${hueField ? " text-primary cursor-pointer" : " text-primary/40"}`}
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

								<fieldset className="fieldset">
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

								<ChartCopyButton ref={chartRef} />
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
									onLegendHover={setHoveredLegend}
								/>
							) : (
								<div className="aspect-5/2">loading...</div>
							)}
						</>
					) : (
						<></>
					)}

					{Object.entries(unfinishedAnalyses!).map(([analysis_run_name, time]) => {
						const timeSinceStarted = currTime - time;

						return (
							<div className="flex flex-col justify-center items-center pt-4">
								<span>
									Calculating for{" "}
									<Link className="link link-primary link-hover" href={`/explore/analysis/${analysis_run_name}`}>
										{analysis_run_name}
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
				<div className="aspect-5/2">
					No Alpha Diversities available for this analysis. Please raise an issue on our{" "}
					<Link className="link link-primary link-hover" href="https://github.com/aomlomics/ocean-dna-explorer/issues">
						Github
					</Link>{" "}
					about this error.
				</div>
			)}
		</div>
	);
}
