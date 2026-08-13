"use client";

import LoadingTaxonomyVisualize from "@/app/components/charts/loading/LoadingTaxonomyVisualize";
import TaxonomyVisualize from "@/app/components/charts/wrappers/TaxonomyVisualize";
import { fetcherAllSuccess } from "@/app/helpers/utils";
import {
	AssignmentPartialWithRelationsSchema,
	OccurrencePartialSchema,
	SamplePartialWithRelationsSchema,
	TaxonomyPartialSchema
} from "@/prisma/generated/zod";
import { TaxonomicRanks } from "@/types/objects";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";

export default function VisualizeTaxonomy() {
	const searchParams = useSearchParams();

	const stringParams = searchParams.toString();
	const { data, error, isLoading } = useSWR(
		[
			`/api/occurrence/swapToTable?fields=lib_id,featureid,organismQuantity&${stringParams}`,
			`/api/assignment/swapToTable?fields=featureid&relations=Taxonomy&${stringParams}`,
			`/api/taxonomy/swapToTable?fields=id,${TaxonomicRanks.join(",")}&${stringParams}`,
			`/api/sample/swapToTable?relations=Libraries&relationsAllFields=true&${stringParams}`
		],
		fetcherAllSuccess,
		{ revalidateOnFocus: false }
	);
	if (error) {
		throw new Error("Taxonomy query failed to reach the server.");
	}
	if (isLoading || !data) {
		return <LoadingTaxonomyVisualize />;
	}

	const [occurrenceData, assignmentData, taxonomyData, sampleData] = data;

	return (
		<TaxonomyVisualize
			occurrences={occurrenceData.result.map((r: any) => OccurrencePartialSchema.parse(r))}
			assignments={assignmentData.result.map((r: any) => AssignmentPartialWithRelationsSchema.parse(r))}
			taxonomies={taxonomyData.result.map((r: any) => TaxonomyPartialSchema.parse(r))}
			samples={sampleData.result.map((r: any) => SamplePartialWithRelationsSchema.parse(r))}
		/>
	);
}
