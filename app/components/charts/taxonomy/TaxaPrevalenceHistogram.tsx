"use client";

import { useMemo, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from "chart.js";
import useDaisyTheme from "@/app/hooks/useDaisyTheme";
import ChartCopyButton from "../ChartCopyButton";
import type { TaxonomicRank } from "@/types/globals";
import {
	type AssignsByFeatureid,
	type TaxonomiesByName,
	type LibsWithSampleById,
	PREVALENCE_DEFAULT_RANK
} from "../wrappers/TaxonomyVisualize";
import chroma from "chroma-js";
import type { SampleModel } from "@/app/generated/prisma/models";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

export default function TaxaPrevalenceHistogram({
	assignsByFeatureid,
	taxonomiesByName,
	libsWithSampleById,
	taxaRanksWithData
}: {
	assignsByFeatureid: AssignsByFeatureid;
	taxonomiesByName: TaxonomiesByName;
	libsWithSampleById: LibsWithSampleById;
	taxaRanksWithData: TaxonomicRank[];
}) {
	const ref = useRef<ChartJS<"bar">>(null);
	const { textColor, primaryColor } = useDaisyTheme();
	const gridColor = chroma(textColor).alpha(0.3).hex();

	const [rank, setRank] = useState(PREVALENCE_DEFAULT_RANK);

	const chartData = useMemo(() => {
		const samplesByTaxon = new Map<string, Set<SampleModel["id"]>>();

		for (const assign of Object.values(assignsByFeatureid)) {
			const taxon = taxonomiesByName[assign.taxonomy]![rank];
			if (taxon) {
				let sampleSet = samplesByTaxon.get(taxon);
				if (!sampleSet) {
					sampleSet = new Set();
					samplesByTaxon.set(taxon, sampleSet);
				}

				for (const occ of assign.Occurrences) {
					if (occ.organismQuantity) {
						sampleSet.add(libsWithSampleById.get(occ.Library.id)!.Sample.id);
					}
				}
			}
		}

		// bin: number of samples detected in -> number of taxa with that count
		const bins = new Map<number, number>();
		let maxSamples = 0;
		for (const sampleSet of samplesByTaxon.values()) {
			const count = sampleSet.size;
			if (count) {
				bins.set(count, (bins.get(count) ?? 0) + 1);
				maxSamples = Math.max(maxSamples, count);
			}
		}

		const labels = Array.from({ length: maxSamples }, (_, index) => index + 1);

		return {
			labels: labels.map(String),
			datasets: [
				{
					label: "Number of taxa",
					data: labels.map((count) => bins.get(count) ?? 0),
					backgroundColor: primaryColor,
					borderColor: primaryColor,
					borderWidth: 1
				}
			]
		};
	}, [assignsByFeatureid, taxonomiesByName, libsWithSampleById, rank, primaryColor]);

	return (
		<div className="relative p-6">
			<div className="w-full flex justify-center items-end gap-5 mb-4">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Taxonomic Rank:</legend>

					<select value={rank} onChange={(e) => setRank(e.target.value as TaxonomicRank)} className="select">
						{taxaRanksWithData.map((r) => (
							<option key={r} value={r}>
								{r}
							</option>
						))}
					</select>
				</fieldset>

				<ChartCopyButton ref={ref} />
			</div>

			<Bar
				ref={ref}
				data={chartData}
				options={{
					responsive: true,
					animation: false,
					plugins: {
						title: {
							display: true,
							text: `How many samples is each ${rank} detected in?`,
							color: textColor
						},
						legend: {
							display: false
						}
					},
					scales: {
						x: {
							title: {
								display: true,
								text: "Number of samples detected in",
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
							beginAtZero: true,
							title: {
								display: true,
								text: "Number of taxa",
								color: textColor
							},
							ticks: {
								color: textColor,
								precision: 0
							},
							grid: {
								color: gridColor
							}
						}
					}
				}}
			/>
		</div>
	);
}
