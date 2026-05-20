"use client";

import { useEffect, useState } from "react";
import { AlphaDiversity, AlphaDiversityIndex, Sample } from "../generated/prisma/client";
import BoxWhiskerPlot from "./charts/BoxWhiskerPlot";
import { ChartData } from "chart.js";
import { SampleScalarFieldEnumSchema } from "@/prisma/generated/zod";

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
	const [currAlphaDiversity, setCurrAlphaDiversity] = useState(alphaDiversities[0]);
	const [currField, setCurrField] = useState("env_local_scale" as Exclude<keyof Sample, "id">);
	const [data, setData] = useState(undefined as ChartData | undefined);

	const [plotKey, setPlotKey] = useState("0");

	useEffect(() => {
		const indexesByLabel = {} as Record<string, number[]>;
		for (const i of currAlphaDiversity.AlphaDiversityIndexes) {
			if (i.Library.Sample[currField]) {
				const key = i.Library.Sample[currField].toString();
				if (!indexesByLabel[key]) {
					indexesByLabel[key] = [i.index];
				} else {
					indexesByLabel[key].push(i.index);
				}
			}
		}

		setData({
			labels: Object.keys(indexesByLabel),
			datasets: [
				{
					data: Object.values(indexesByLabel),
					borderColor: "rgb(255, 99, 132)",
					backgroundColor: "rgba(255, 99, 132, 0.5)"
				}
			]
		});
		setPlotKey((Math.random() + 1).toString(36).substring(7));
	}, [currAlphaDiversity, currField]);

	return (
		<div className="p-6">
			<div className="flex">
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
						{SampleScalarFieldEnumSchema.options.map((f) => (
							<option key={f}>{f}</option>
						))}
					</select>
				</fieldset>
			</div>

			{data ? <BoxWhiskerPlot key={plotKey} data={data} /> : <>loading...</>}
		</div>
	);
}
