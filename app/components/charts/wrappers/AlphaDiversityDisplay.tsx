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
	alphaDiversities: {
		id: AlphaDiversity["id"];
		dateCalculated: AlphaDiversity["dateCalculated"];
		finished: AlphaDiversity["finished"];
		analysis_run_name: AlphaDiversity["analysis_run_name"];
		indexType: AlphaDiversity["indexType"];
		depth: AlphaDiversity["depth"];
		AlphaDiversityIndexes: {
			index: AlphaDiversityIndex["index"];
			Library: {
				Sample: Sample;
			};
		}[];
	}[];
	sameAnalysis?: boolean;
}) {
	const { primaryColor } = useDaisyTheme();

	const chartRef = useRef<ChartJS>(null);
	//state variable to trigger plot re-render
	const [chartKey, setChartKey] = useState("0");

	const [currAlphaDiversity, setCurrAlphaDiversity] = useState(
		alphaDiversities[0] as (typeof alphaDiversities)[0] | undefined
	);
	const [xField, setXField] = useState("env_local_scale");
	const [hueField, setHueField] = useState("");
	const [hoveredLegend, setHoveredLegend] = useState(undefined as string | undefined);
	const [data, setData] = useState(undefined as ChartData | undefined);

	const [timeSinceStarted, setTimeSinceStarted] = useState(undefined as undefined | number);

	const userDefinedFields = new Set() as Set<string>;
	for (const ad of alphaDiversities) {
		for (const index of ad.AlphaDiversityIndexes) {
			if (index.Library.Sample.userDefined) {
				Object.keys(index.Library.Sample.userDefined).forEach(userDefinedFields.add, userDefinedFields);
			}
		}
	}

	function getSampleFieldValue(sample: Sample, field: string, type: string) {
		if (!currAlphaDiversity) {
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
			//value is analysis_run_name, is user defined, or does not exist
			if (field === "analysis_run_name") {
				//analysis_run_name
				return currAlphaDiversity.analysis_run_name;
			} else if (userDefinedFields.has(field) && sample.userDefined && sample.userDefined[field] != null) {
				//user defined and exists
				return sample.userDefined[field];
			} else {
				//default
				return "no value";
			}
		}
	}

	useEffect(() => {
		if (currAlphaDiversity && currAlphaDiversity.finished) {
			const xType =
				xField === "analysis_run_name" || userDefinedFields.has(xField) ? "string" : getZodType("sample", xField).type;

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

			for (const i of currAlphaDiversity.AlphaDiversityIndexes) {
				//get string representation of values
				const xValue = getSampleFieldValue(i.Library.Sample, xField, xType);
				let hueValue;
				if (hueField) {
					hueValue = getSampleFieldValue(i.Library.Sample, hueField, hueType!);
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
	}, [currAlphaDiversity, xField, hueField]);

	useEffect(() => {
		if (currAlphaDiversity && !currAlphaDiversity.finished) {
			const interval = setInterval(
				() =>
					setTimeSinceStarted((prev) =>
						prev ? prev + 1000 : new Date().getTime() - currAlphaDiversity.dateCalculated.getTime() + 1000
					),
				1000
			);

			return () => clearInterval(interval);
		}
	}, [currAlphaDiversity]);

	useEffect(() => {
		if (data && data.datasets.length > 1) {
			if (hoveredLegend) {
				//dim every color except hovered legend color
				setData({
					labels: data.labels,
					datasets: data.datasets.map((ds) => ({
						label: ds.label,
						data: ds.data,
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
						label: ds.label,
						data: ds.data,
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

	const omit = ["id", "userDefined", "deleted_ODE", "project_id"];
	return (
		<div className="p-6">
			{currAlphaDiversity ? (
				<>
					<div className="w-full flex justify-center items-center gap-5">
						<fieldset className="fieldset">
							<legend className="fieldset-legend">Metric:</legend>
							<select
								value={currAlphaDiversity.id}
								onChange={(e) =>
									setCurrAlphaDiversity(alphaDiversities.find((ad) => ad.id === parseInt(e.currentTarget.value))!)
								}
								className="select"
							>
								{alphaDiversities.map((ad) => (
									<option key={ad.id} value={ad.id}>
										{`${ad.indexType}${ad.depth ? ` (${ad.depth})` : ""}`}
									</option>
								))}
							</select>
						</fieldset>

						<fieldset className="fieldset">
							<legend className="fieldset-legend">X Field:</legend>
							<select
								value={xField}
								onChange={(e) => setXField(e.currentTarget.value)}
								className="select"
								disabled={!currAlphaDiversity.finished}
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
							<select
								value={hueField}
								onChange={(e) => setHueField(e.currentTarget.value)}
								className="select"
								disabled={!currAlphaDiversity.finished}
							>
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

						<ChartCopyButton ref={chartRef} disabled={!currAlphaDiversity.finished} />
					</div>

					{currAlphaDiversity.finished ? (
						data ? (
							<BoxWhiskerPlot
								key={chartKey}
								data={data}
								ref={chartRef}
								title={`${currAlphaDiversity.indexType.slice(0, 1).toUpperCase() + currAlphaDiversity.indexType.slice(1)} Alpha Diversity${currAlphaDiversity.depth ? " at " + currAlphaDiversity.depth + " depth" : ""}${hueField ? " by " + hueField : ""}`}
								xField={xField}
								yField={"Index"}
								legend={!!hueField}
								onLegendHover={setHoveredLegend}
							/>
						) : (
							<div className="aspect-5/2">loading...</div>
						)
					) : (
						<div className="flex flex-col justify-center items-center pt-4">
							Calculating...
							{timeSinceStarted && timeSinceStarted >= 1000 ? (
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
							) : (
								<></>
							)}
						</div>
					)}
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
