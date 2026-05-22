"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { AlphaDiversity, AlphaDiversityIndex, Sample } from "../generated/prisma/client";
import BoxWhiskerPlot from "./charts/BoxWhiskerPlot";
import { Chart as ChartJS, ChartData } from "chart.js";
import { SampleScalarFieldEnumSchema } from "@/prisma/generated/zod";
import { getZodType } from "../helpers/schema";
import ChartCopyButton from "./charts/ChartCopyButton";
import { DeadValueEnum, DeadValueNumbers } from "@/types/enums";
import useDaisyTheme from "../hooks/useDaisyTheme";
import chroma from "chroma-js";

export default function AlphaDiversityDisplay({
	alphaDiversities
}: {
	alphaDiversities: {
		id: AlphaDiversity["id"];
		finished: AlphaDiversity["finished"];
		indexType: AlphaDiversity["indexType"];
		depth: AlphaDiversity["depth"];
		AlphaDiversityIndexes: {
			index: AlphaDiversityIndex["index"];
			Library: {
				Sample: Sample;
			};
		}[];
	}[];
}) {
	const { primaryColor } = useDaisyTheme();

	const chartRef = useRef<ChartJS>(null);
	//state variable to trigger plot re-render
	const [chartKey, setChartKey] = useState("0");

	const [currAlphaDiversity, setCurrAlphaDiversity] = useState(alphaDiversities[0]);
	const [currField, setCurrField] = useState("env_local_scale" as string);
	const [data, setData] = useState(undefined as ChartData | undefined);

	const userDefinedFields = new Set() as Set<string>;
	for (const ad of alphaDiversities) {
		for (const index of ad.AlphaDiversityIndexes) {
			if (index.Library.Sample.userDefined) {
				Object.keys(index.Library.Sample.userDefined).forEach(userDefinedFields.add, userDefinedFields);
			}
		}
	}

	useEffect(() => {
		const type = getZodType("sample", currField).type;

		const indexesByLabel = {} as Record<string, number[]>;
		const badIndexesByLabel = {} as Record<string, number[]>;
		for (const i of currAlphaDiversity.AlphaDiversityIndexes) {
			//get string representation of value
			let key;
			let obj = indexesByLabel;
			if (i.Library.Sample[currField as keyof Sample] != null) {
				const keyField = currField as keyof Sample;
				//value exists
				if ((i.Library.Sample[keyField] as string | number) in DeadValueEnum) {
					//dead value
					obj = badIndexesByLabel;

					if (DeadValueNumbers.includes(i.Library.Sample[keyField] as number)) {
						key = DeadValueEnum[i.Library.Sample[keyField] as number];
					} else {
						key = i.Library.Sample[keyField]!.toString();
					}
				} else if (!userDefinedFields.has(currField) && type === "date") {
					//date
					key = new Date(i.Library.Sample[keyField] as string | Date).toLocaleDateString();
				} else {
					//default
					key = i.Library.Sample[keyField]!.toString();
				}
			} else {
				//value does not exist or is user defined
				if (
					userDefinedFields.has(currField) &&
					i.Library.Sample.userDefined &&
					i.Library.Sample.userDefined[currField] != null
				) {
					//user defined and exists
					key = i.Library.Sample.userDefined[currField];
				} else {
					//default
					obj = badIndexesByLabel;
					key = "no value";
				}
			}

			if (!obj[key]) {
				obj[key] = [i.index];
			} else {
				obj[key].push(i.index);
			}
		}

		let sortedLabels;
		if (type === "float" || type === "integer") {
			sortedLabels = Object.keys(indexesByLabel).sort((a, b) => parseFloat(a) - parseFloat(b));
		} else if (type === "date") {
			sortedLabels = Object.keys(indexesByLabel).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
		} else {
			sortedLabels = Object.keys(indexesByLabel).sort();
		}
		const sortedData = [];
		for (const label of sortedLabels) {
			sortedData.push(indexesByLabel[label]);
		}
		//put "no value" and dead values at the end
		const sortedBadLabels = Object.keys(badIndexesByLabel).sort();
		sortedLabels.push(...sortedBadLabels);
		for (const label of sortedBadLabels) {
			sortedData.push(badIndexesByLabel[label]);
		}

		setData({
			labels: sortedLabels,
			datasets: [
				{
					data: sortedData,
					borderColor: primaryColor,
					backgroundColor: chroma(primaryColor).alpha(0.5).hex()
				}
			]
		});
		setChartKey((Math.random() + 1).toString(36).substring(7));
	}, [currAlphaDiversity, currField]);

	useEffect(() => {
		if (data) {
			setData({
				labels: data.labels,
				datasets: data.datasets.map((ds) => ({
					data: ds.data,
					borderColor: primaryColor,
					backgroundColor: chroma(primaryColor).alpha(0.5).hex()
				}))
			});
			setChartKey((Math.random() + 1).toString(36).substring(7));
		}
	}, [primaryColor]);

	const omit = ["id", "userDefined", "deleted_ODE", "project_id"];
	return (
		<div className="p-6">
			<div className="w-full flex justify-center items-center gap-5">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Alpha Diversity:</legend>
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
					<legend className="fieldset-legend">Field:</legend>
					<select
						value={currField}
						onChange={(e) => setCurrField(e.currentTarget.value as typeof currField)}
						className="select"
					>
						{SampleScalarFieldEnumSchema.options.reduce((acc, f) => {
							if (!omit.includes(f)) {
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
					ref={chartRef}
					alphaDiversity={currAlphaDiversity}
					field={currField}
					data={data}
				/>
			) : (
				<>loading...</>
			)}
		</div>
	);
}
