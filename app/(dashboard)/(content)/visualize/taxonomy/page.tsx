"use client";

import LoadingTaxonomyVisualize from "@/app/components/charts/loading/LoadingTaxonomyVisualize";
import TaxonomyVisualize from "@/app/components/charts/wrappers/TaxonomyVisualize";
import { Assignment, Library, Occurrence, Sample, Taxonomy } from "@/app/generated/prisma/client";
import {
	AssignmentPartialWithRelationsSchema,
	OccurrencePartialSchema,
	SamplePartialWithRelationsSchema,
	TaxonomyPartialSchema
} from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { TaxonomicRanks } from "@/types/objects";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VisualizeTaxonomy() {
	const searchParams = useSearchParams();

	const [occurrences, setOccurrences] = useState(
		undefined as
			| {
					lib_id: Occurrence["lib_id"];
					featureid: Occurrence["featureid"];
					organismQuantity: Occurrence["organismQuantity"];
			  }[]
			| undefined
	);
	const [assignments, setAssignments] = useState(
		undefined as
			| {
					featureid: Assignment["featureid"];
					percent_id: Assignment["percent_id"];
					Taxonomy: {
						id: Taxonomy["id"];
					};
			  }[]
			| undefined
	);
	const [taxonomies, setTaxonomies] = useState(
		undefined as
			| (Record<(typeof TaxonomicRanks)[number], string | null> & {
					id: Taxonomy["id"];
					taxonomy: Taxonomy["taxonomy"];
			  })[]
			| undefined
	);
	const [samples, setSamples] = useState(
		undefined as
			| (Sample & {
					Libraries: {
						lib_id: Library["lib_id"];
					}[];
			  })[]
			| undefined
	);

	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);

		async function doFetch() {
			//occurrences
			const occRes = await fetch(
				`/api/occurrence/swapToTable?fields=lib_id,featureid,organismQuantity&${searchParams}`
			);
			if (!occRes.ok) {
				throw new Error("Occurrence query failed to reach the server.");
			}
			const occResponse = (await occRes.json()) as NetworkPacket;
			if (occResponse.statusMessage === "error") {
				throw new Error(occResponse.error);
			}
			setOccurrences(occResponse.result.map((r: any) => OccurrencePartialSchema.parse(r)));

			//assignments
			const assignRes = await fetch(
				`/api/assignment/swapToTable?fields=featureid,percent_id&relations=Taxonomy&${searchParams}`
			);
			if (!assignRes.ok) {
				throw new Error("Assignment query failed to reach the server.");
			}
			const assignResponse = (await assignRes.json()) as NetworkPacket;
			if (assignResponse.statusMessage === "error") {
				throw new Error(assignResponse.error);
			}
			setAssignments(assignResponse.result.map((r: any) => AssignmentPartialWithRelationsSchema.parse(r)));

			//taxonomies
			const taxaRes = await fetch(
				`/api/taxonomy/swapToTable?fields=id,taxonomy,${TaxonomicRanks.join(",")}&${searchParams}`
			);
			if (!taxaRes.ok) {
				throw new Error("Taxonomy query failed to reach the server.");
			}
			const taxaResponse = (await taxaRes.json()) as NetworkPacket;
			if (taxaResponse.statusMessage === "error") {
				throw new Error(taxaResponse.error);
			}
			setTaxonomies(taxaResponse.result.map((r: any) => TaxonomyPartialSchema.parse(r)));

			//samples
			const sampleRes = await fetch(
				`/api/sample/swapToTable?relations=Libraries&relationsAllFields=true&${searchParams}`
			);
			if (!sampleRes.ok) {
				throw new Error("Sample query failed to reach the server.");
			}
			const sampleResponse = (await sampleRes.json()) as NetworkPacket;
			if (sampleResponse.statusMessage === "error") {
				throw new Error(sampleResponse.error);
			}
			setSamples(sampleResponse.result.map((r: any) => SamplePartialWithRelationsSchema.parse(r)));

			setLoading(false);
		}

		doFetch();
	}, [searchParams]);

	if (loading || !occurrences || !assignments || !taxonomies || !samples) {
		return <LoadingTaxonomyVisualize />;
	}

	return (
		<TaxonomyVisualize occurrences={occurrences} assignments={assignments} taxonomies={taxonomies} samples={samples} />
	);
}
