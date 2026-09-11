"use client";

import { DeadValueEnum } from "@/types/enums";
import type {
	AssignmentModel,
	LibraryModel,
	OccurrenceModel,
	SampleModel,
	TaxonomyModel
} from "@/app/generated/prisma/models";
import { getZodType } from "@/app/helpers/schema";
import { GlobalOmit } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";
import { SampleScalarFieldEnumSchema } from "@/prisma/generated/zod";
import type { TaxonomicRank } from "@/types/globals";
import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { TAXONOMY_VISUALIZE_TABS } from "../taxonomy/tabs";
import { useSearchParams } from "next/navigation";
import LoadingTaxaBarChart from "../loading/taxonomy/LoadingTaxaBarChart";
import LoadingTaxonomyTreemap from "../loading/taxonomy/LoadingTaxonomyTreemap";
import LoadingTaxaPrevalenceHistogram from "../loading/taxonomy/LoadingTaxaPrevalenceHistogram";
import LoadingTaxaSampleHeatmap from "../loading/taxonomy/LoadingTaxaSampleHeatmap";
import LoadingCompositionBarChart from "../loading/taxonomy/composition/LoadingCompositionBarChart";
import LoadingTaxonomyLollipopChart from "../loading/taxonomy/composition/LoadingTaxonomyLollipopChart";
import LoadingCompositionSunburst from "../loading/taxonomy/composition/LoadingCompositionSunburst";
import LoadingDarkTaxaPlot from "../loading/taxonomy/LoadingDarkTaxaPlot";

import dynamic from "next/dynamic";
const TaxaBarChart = dynamic(() => import("../taxonomy/TaxaBarChart"), {
	ssr: false
});
const TaxonomyTreemap = dynamic(() => import("../taxonomy/TaxonomyTreemap"), {
	ssr: false
});
const TaxaPrevalenceHistogram = dynamic(() => import("../taxonomy/TaxaPrevalenceHistogram"), {
	ssr: false
});
const TaxaSampleHeatmap = dynamic(() => import("../taxonomy/TaxaSampleHeatmap"), {
	ssr: false
});
const CompositionBarChart = dynamic(() => import("../taxonomy/composition/CompositionBarChart"), {
	ssr: false
});
const TaxonomyLollipopChart = dynamic(() => import("../taxonomy/composition/TaxonomyLollipopChart"), {
	ssr: false
});
const CompositionSunburst = dynamic(() => import("../taxonomy/composition/CompositionSunburst"), {
	ssr: false
});
const DarkTaxaPlot = dynamic(() => import("../taxonomy/DarkTaxaPlot"), {
	ssr: false
});

export type AssignsByFeatureid = Record<
	AssignmentModel["featureid"],
	{
		featureid: AssignmentModel["featureid"];
		taxonomy: AssignmentModel["taxonomy"];
		percent_id: AssignmentModel["percent_id"];
		Occurrences: {
			organismQuantity: OccurrenceModel["organismQuantity"];
			Library: {
				id: LibraryModel["id"];
			};
		}[];
	}
>;

export type TaxonomiesByName = Record<
	TaxonomyModel["taxonomy"],
	Record<TaxonomicRank, string | null> & {
		taxonomy: TaxonomyModel["taxonomy"];
	}
>;

//using a map to maintain the number type on the key
export type LibsWithSampleById = Map<
	LibraryModel["id"],
	{
		id: LibraryModel["id"];
		lib_id: LibraryModel["lib_id"];
		Sample: SampleModel;
	}
>;

export const ABUNDANCE_DEFAULT_RANK = "kingdom" as TaxonomicRank;
export const TREEMAP_DEFAULT_PARENT_RANK = "phylum" as TaxonomicRank;
export const TREEMAP_DEFAULT_CHILD_RANK = "family" as TaxonomicRank;
export const PREVALENCE_DEFAULT_RANK = "species" as TaxonomicRank;
export const HEATMAP_DEFAULT_RANK = "family" as TaxonomicRank;
export const COMPOSITION_BAR_DEFAULT_RANK = "family" as TaxonomicRank;
export const COMPOSITION_LOLLIPOP_DEFAULT_RANK = "species" as TaxonomicRank;
export const COMPOSITION_SUNBURST_DEFAULT_INNER_RANK = "phylum" as TaxonomicRank;
export const COMPOSITION_SUNBURST_DEFAULT_OUTER_RANK = "family" as TaxonomicRank;
export const DARK_TAXA_DEFAULT_THRESHOLD = 90;
export const DARK_TAXA_DEFAULT_INNER_RANK = "kingdom" as TaxonomicRank;
export const DARK_TAXA_DEFAULT_OUTER_RANK = "phylum" as TaxonomicRank;

export default function TaxonomyVisualize({
	assignsByFeatureid,
	taxonomiesByName,
	libsWithSampleById,
	pathnamePrefix,
	loading
}: {
	assignsByFeatureid: AssignsByFeatureid;
	taxonomiesByName: TaxonomiesByName;
	libsWithSampleById: LibsWithSampleById;
	pathnamePrefix?: string;
	loading?: boolean;
}) {
	const searchParams = useSearchParams();
	const [tab, setTab] = useState(["abundance"]);

	const { sampFields, userDefinedFields, sampleLabels, libraryLabels, sortedLibraries, totalOrganismQuantity } =
		useMemo(() => {
			const sampFields = new Set(["project_id"]) as Set<string>;
			//build fields in fieldOrder
			for (const f of TableMetadata.sample.fieldOrder!) {
				sampFields.add(f);
			}
			for (const f of SampleScalarFieldEnumSchema.options.sort()) {
				sampFields.add(f);
			}

			//remove bad fields
			for (const omit of GlobalOmit) {
				sampFields.delete(omit);
			}
			sampFields.delete("id");
			sampFields.delete("userDefined");
			sampFields.delete("samp_name");

			const fieldsWithValues = new Set<string>();
			const userDefinedFields = new Set<string>();

			//deduplicate samples
			const samples = Array.from(
				new Map(Array.from(libsWithSampleById.values()).map(({ Sample }) => [Sample.id, Sample])).values()
			);

			for (const samp of samples) {
				//check if fields have values
				for (const f of sampFields) {
					const key = f as keyof SampleModel;

					if (!fieldsWithValues.has(f) && samp[key] != null) {
						const type = getZodType("sample", key).type;

						if (type !== "boolean") {
							if (type === "date" && !((samp[key] as Date).getTime() in DeadValueEnum)) {
								fieldsWithValues.add(f);
							} else if (!((samp[key] as string | number) in DeadValueEnum)) {
								fieldsWithValues.add(f);
							}
						}
					}
				}

				//add userDefined fields
				if (samp.userDefined) {
					for (const ud in samp.userDefined) {
						if (
							samp.userDefined[ud] != null &&
							!(samp.userDefined[ud] in DeadValueEnum) &&
							samp.userDefined[ud] !== ""
						) {
							sampFields.add(ud);
							fieldsWithValues.add(ud);
							userDefinedFields.add(ud);
						}
					}
				}
			}

			//build sample id to label mapping
			const sortedSamples = [...samples].sort((a, b) => a.samp_name.localeCompare(b.samp_name));
			const sampNamesWithProjectId = {} as Record<
				SampleModel["samp_name"],
				{ id: SampleModel["id"]; project_id: SampleModel["project_id"] }[]
			>;

			for (const samp of sortedSamples) {
				(sampNamesWithProjectId[samp.samp_name] ??= []).push({ id: samp.id, project_id: samp.project_id });
			}

			const sampleLabels = new Map() as Map<SampleModel["id"], string>;
			for (const [samp_name, projectIds] of Object.entries(sampNamesWithProjectId)) {
				if (projectIds.length > 1) {
					for (const proj of projectIds) {
						sampleLabels.set(proj.id, proj.project_id + " / " + samp_name);
					}
				} else {
					sampleLabels.set(projectIds[0]!.id, samp_name);
				}
			}

			//build library id to label mapping
			const sortedLibraries = Array.from(libsWithSampleById.entries()).sort(([_, a], [__, b]) =>
				a.lib_id.localeCompare(b.lib_id)
			);
			const libIdsWithProjectId = {} as Record<
				LibraryModel["lib_id"],
				{ id: LibraryModel["id"]; project_id: SampleModel["project_id"] }[]
			>;

			for (const [_, lib] of sortedLibraries) {
				(libIdsWithProjectId[lib.lib_id] ??= []).push({
					id: lib.id,
					project_id: lib.Sample.project_id
				});
			}

			const libraryLabels = new Map() as Map<LibraryModel["id"], string>;
			for (const [lib_id, projectIds] of Object.entries(libIdsWithProjectId)) {
				if (projectIds.length > 1) {
					for (const proj of projectIds) {
						libraryLabels.set(proj.id, proj.project_id + " / " + lib_id);
					}
				} else {
					libraryLabels.set(projectIds[0]!.id, lib_id);
				}
			}

			let totalOrganismQuantity = 0;
			for (const assign of Object.values(assignsByFeatureid)) {
				for (const occ of assign.Occurrences) {
					if (occ.organismQuantity > 0) {
						totalOrganismQuantity += Number(occ.organismQuantity);
					}
				}
			}

			return {
				sampFields,
				userDefinedFields,
				sampleLabels,
				libraryLabels,
				sortedLibraries: new Map(sortedLibraries),
				totalOrganismQuantity
			};
		}, [assignsByFeatureid, libsWithSampleById]);

	//build tabs
	const newParams = new URLSearchParams(searchParams);
	const page = pathnamePrefix ? newParams.get("chart")?.split(",") : undefined;
	newParams.delete("chart");

	function getTab(
		route: keyof typeof TAXONOMY_VISUALIZE_TABS,
		t: (typeof TAXONOMY_VISUALIZE_TABS)[keyof typeof TAXONOMY_VISUALIZE_TABS],
		i: number,
		parentPath: string[] = []
	) {
		const clickPath = [...parentPath, route];
		let curr = t;
		while (curr.tabs) {
			const [r, first] = Object.entries(curr.tabs)[0]!;
			clickPath.push(r);
			curr = first;
		}

		if (page) {
			return (
				<Link
					key={route}
					className={`btn ${page[i] === route ? "btn-primary text-primary-content" : "text-base-content"}`}
					href={`${pathnamePrefix}?chart=${clickPath.join(",")}${newParams.size ? "&" + newParams.toString() : ""}`}
				>
					{t.title}
				</Link>
			);
		}

		return (
			<button
				key={route}
				className={`btn ${tab[i] === route ? "btn-primary text-primary-content" : "text-base-content"}`}
				onClick={() => {
					setTab(clickPath);
				}}
			>
				{t.title}
			</button>
		);
	}

	//base tabs
	const tabRows: ReactNode[][] = [Object.entries(TAXONOMY_VISUALIZE_TABS).map(([route, t]) => getTab(route, t, 0))];

	const currentTab = page ?? tab;

	//show nested tabs if they exist for currently selected tab
	let curr = TAXONOMY_VISUALIZE_TABS[currentTab[0]!]!;
	let parentPath = [currentTab[0]!];
	let i = 1;
	while (curr.tabs) {
		tabRows.push(Object.entries(curr.tabs).map(([route, t]) => getTab(route, t, i, parentPath)));

		const selectedRoute = currentTab[i]!;
		curr = curr.tabs[selectedRoute]!;
		parentPath = [...parentPath, selectedRoute];
		i++;
	}

	return (
		<>
			<div className="flex flex-col items-center gap-2">
				{tabRows.map((row, i) => (
					<div key={i} className="flex justify-center gap-2">
						{row}
					</div>
				))}
			</div>

			{currentTab[0] === "abundance" ? (
				loading ? (
					<LoadingTaxaBarChart />
				) : (
					<TaxaBarChart
						assignsByFeatureid={assignsByFeatureid}
						taxonomiesByName={taxonomiesByName}
						libsWithSampleById={sortedLibraries}
						sampFields={Array.from(sampFields)}
						userDefinedFields={userDefinedFields}
						libraryLabels={libraryLabels}
					/>
				)
			) : (
				<></>
			)}

			{currentTab[0] === "treemap" ? (
				loading ? (
					<LoadingTaxonomyTreemap />
				) : (
					<TaxonomyTreemap assignsByFeatureid={assignsByFeatureid} taxonomiesByName={taxonomiesByName} />
				)
			) : (
				<></>
			)}

			{currentTab[0] === "prevalence" ? (
				loading ? (
					<LoadingTaxaPrevalenceHistogram />
				) : (
					<TaxaPrevalenceHistogram
						assignsByFeatureid={assignsByFeatureid}
						taxonomiesByName={taxonomiesByName}
						libsWithSampleById={libsWithSampleById}
					/>
				)
			) : (
				<></>
			)}

			{currentTab[0] === "heatmap" ? (
				loading ? (
					<LoadingTaxaSampleHeatmap />
				) : (
					<TaxaSampleHeatmap
						assignsByFeatureid={assignsByFeatureid}
						taxonomiesByName={taxonomiesByName}
						libsWithSampleById={libsWithSampleById}
						sampleLabels={sampleLabels}
					/>
				)
			) : (
				<></>
			)}

			{currentTab[0] === "composition" ? (
				<>
					{currentTab[1] === "bar" ? (
						loading ? (
							<LoadingCompositionBarChart />
						) : (
							<CompositionBarChart assignsByFeatureid={assignsByFeatureid} taxonomiesByName={taxonomiesByName} />
						)
					) : (
						<></>
					)}
					{currentTab[1] === "lollipop" ? (
						loading ? (
							<LoadingTaxonomyLollipopChart />
						) : (
							<TaxonomyLollipopChart assignsByFeatureid={assignsByFeatureid} taxonomiesByName={taxonomiesByName} />
						)
					) : (
						<></>
					)}
					{currentTab[1] === "sunburst" ? (
						loading ? (
							<LoadingCompositionSunburst />
						) : (
							<CompositionSunburst assignsByFeatureid={assignsByFeatureid} taxonomiesByName={taxonomiesByName} />
						)
					) : (
						<></>
					)}
				</>
			) : (
				<></>
			)}

			{currentTab[0] === "darkTaxa" ? (
				loading ? (
					<LoadingDarkTaxaPlot />
				) : (
					<DarkTaxaPlot
						assignsByFeatureid={assignsByFeatureid}
						taxonomiesByName={taxonomiesByName}
						libsWithSampleById={libsWithSampleById}
						totalOrganismQuantity={totalOrganismQuantity}
					/>
				)
			) : (
				<></>
			)}
		</>
	);
}
