"use client";

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
		[] as {
			lib_id: Occurrence["lib_id"];
			featureid: Occurrence["featureid"];
			organismQuantity: Occurrence["organismQuantity"];
		}[]
	);
	const [assignments, setAssignments] = useState(
		[] as {
			featureid: Assignment["featureid"];
			Taxonomy: {
				id: Taxonomy["id"];
			};
		}[]
	);
	const [taxonomies, setTaxonomies] = useState(
		[] as (Record<(typeof TaxonomicRanks)[number], string | null> & { id: Taxonomy["id"] })[]
	);
	const [samples, setSamples] = useState(
		[] as (Sample & {
			Libraries: {
				lib_id: Library["lib_id"];
			}[];
		})[]
	);

	const [key, setKey] = useState("0");
	function rerender() {
		setKey((Math.random() + 1).toString(36).substring(7));
	}

	useEffect(() => {
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
			const assignRes = await fetch(`/api/assignment/swapToTable?fields=featureid&relations=Taxonomy&${searchParams}`);
			if (!assignRes.ok) {
				throw new Error("Assignment query failed to reach the server.");
			}
			const assignResponse = (await assignRes.json()) as NetworkPacket;
			if (assignResponse.statusMessage === "error") {
				throw new Error(assignResponse.error);
			}
			setAssignments(assignResponse.result.map((r: any) => AssignmentPartialWithRelationsSchema.parse(r)));

			//taxonomies
			const taxaRes = await fetch(`/api/taxonomy/swapToTable?fields=id,${TaxonomicRanks.join(",")}&${searchParams}`);
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

			rerender();
		}

		doFetch();
	}, [searchParams]);

	if (!occurrences.length || !assignments.length || !taxonomies.length || !samples.length) {
		return <>oop</>;
	}

	return (
		<TaxonomyVisualize
			key={key}
			occurrences={occurrences}
			assignments={assignments}
			taxonomies={taxonomies}
			samples={samples}
		/>
	);
}
