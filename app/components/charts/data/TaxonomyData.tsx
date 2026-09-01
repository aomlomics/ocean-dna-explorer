"use client";

import { fetcherAllSuccess } from "@/app/helpers/utils";
import { useTrusted } from "@/app/hooks/TrustedProvider";
import { TaxonomicRanks } from "@/types/objects";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import LoadingTaxonomyVisualize from "../loading/LoadingTaxonomyVisualize";
import type { SuccessPacket } from "@/types/globals";
import type {
	AssignmentModel,
	LibraryModel,
	OccurrenceModel,
	SampleModel,
	TaxonomyModel
} from "@/app/generated/prisma/models";
import {
	AssignmentPartialWithRelationsSchema,
	LibrarySchema,
	OccurrencePartialSchema,
	SampleSchema,
	TaxonomyPartialSchema
} from "@/prisma/generated/zod";
import TaxonomyVisualize from "../wrappers/TaxonomyVisualize";
import z from "zod";

export default function TaxonomyData() {
	const searchParams = useSearchParams();
	const { trusted } = useTrusted();

	const stringParams = searchParams.toString();

	const { data, error, isLoading } = useSWR(
		[
			`/api/internal/occurrence/swapToTable?fields=lib_id,featureid,organismQuantity&trusted=${trusted}&${stringParams}`,
			`/api/internal/assignment/swapToTable?fields=featureid,taxonomy&trusted=${trusted}&${stringParams}`,
			`/api/internal/taxonomy/swapToTable?fields=taxonomy,${TaxonomicRanks.join(",")}&trusted=${trusted}&${stringParams}`,
			`/api/internal/sample/swapToTable?relations=Libraries&relationsAllFields=true&trusted=${trusted}&${stringParams}`
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

	const [occurrenceData, assignmentData, taxonomyData, sampleData] = data as [
		SuccessPacket,
		SuccessPacket,
		SuccessPacket,
		SuccessPacket
	];

	const occurrences: OccurrenceModel[] = occurrenceData.result.map((r: unknown) => OccurrencePartialSchema.parse(r));

	const assignments: AssignmentModel[] = assignmentData.result.map((r: unknown) =>
		AssignmentPartialWithRelationsSchema.parse(r)
	);

	const taxonomies: TaxonomyModel[] = taxonomyData.result.map((r: unknown) => TaxonomyPartialSchema.parse(r));

	const samples: (SampleModel & { Libraries: { lib_id: LibraryModel["lib_id"] }[] })[] = sampleData.result.map(
		(r: unknown) =>
			SampleSchema.extend({
				Libraries: z.array(
					LibrarySchema.pick({
						lib_id: true
					})
				)
			}).parse(r)
	);

	const featuresById: Record<
		string,
		{
			taxonomy: string;
			occurrences: {
				lib_id: string;
				organismQuantity: number;
			}[];
		}
	> = {};

	for (const a of assignments) {
		featuresById[a.featureid] = {
			taxonomy: a.taxonomy,
			occurrences: []
		};
	}

	for (const occ of occurrences) {
		const feature = featuresById[occ.featureid];

		if (feature) {
			feature.occurrences.push({
				lib_id: occ.lib_id,
				organismQuantity: occ.organismQuantity
			});
		}
	}

	const taxonomiesByName = Object.fromEntries(taxonomies.map((taxonomy) => [taxonomy.taxonomy, taxonomy]));

	const sampleByLibId = Object.fromEntries(
		samples.flatMap((sample) => sample.Libraries.map((library) => [library.lib_id, sample]))
	);

	return (
		<TaxonomyVisualize featuresById={featuresById} taxonomiesByName={taxonomiesByName} sampleByLibId={sampleByLibId} />
	);
}
