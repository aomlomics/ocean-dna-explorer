"use client";

import { fetcherAll } from "@/app/helpers/utils";
import { useTrusted } from "@/app/hooks/TrustedProvider";
import { TaxonomicRanks } from "@/types/objects";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import type { NetworkPacket } from "@/types/globals";
import type {
	AssignmentModel,
	LibraryModel,
	OccurrenceModel,
	SampleModel,
	TaxonomyModel
} from "@/app/generated/prisma/models";
import {
	AssignmentPartialSchema,
	LibrarySchema,
	OccurrencePartialSchema,
	SampleSchema,
	TaxonomyPartialSchema
} from "@/prisma/generated/zod";
import TaxonomyVisualize from "../wrappers/TaxonomyVisualize";
import z from "zod";
import { FIRST_TAXONOMY_VISUALIZE_TAB } from "../taxonomy/tabs";
import { useEffect, useMemo } from "react";

const AssignmentResultSchema = AssignmentPartialSchema.extend({
	Occurrences: z.array(
		OccurrencePartialSchema.extend({
			Library: LibrarySchema.pick({
				id: true
			})
		})
	)
});

const SampleResultSchema = SampleSchema.extend({
	Libraries: z.array(
		LibrarySchema.pick({
			id: true,
			lib_id: true
		})
	)
});

export default function TaxonomyData({ pathnamePrefix }: { pathnamePrefix: string }) {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();
	const { trusted } = useTrusted();

	useEffect(() => {
		if (searchParams.has("chart")) return;

		const newParams = new URLSearchParams(searchParams);
		newParams.set("chart", FIRST_TAXONOMY_VISUALIZE_TAB.join(","));

		router.replace(`${pathname}?${newParams.toString()}`);
	}, [searchParams, pathname, router]);

	const newParams = new URLSearchParams(searchParams);
	newParams.delete("chart");
	const stringParams = newParams.toString();

	const { data, error, isLoading } = useSWR(
		[
			`/api/internal/assignment/swapToTable?fields=featureid,taxonomy,percent_id&relations=occurrence,library&relationsFields=occurrence,organismQuantity&trusted=${trusted}&${stringParams}`,
			`/api/internal/taxonomy/swapToTable?fields=taxonomy,${TaxonomicRanks.join(",")}&trusted=${trusted}&${stringParams}`,
			`/api/internal/sample/swapToTable?relations=Libraries&relationsFields=library,id,lib_id&trusted=${trusted}&${stringParams}`
		],
		fetcherAll,
		{ revalidateOnFocus: false }
	);

	const { assignments, taxonomiesByName, libsWithSampleById } = useMemo(() => {
		if (isLoading || !data) {
			return {
				assignments: [],
				taxonomiesByName: {},
				libsWithSampleById: new Map()
			};
		}

		const [assignmentData, taxonomyData, sampleData] = data as [NetworkPacket, NetworkPacket, NetworkPacket];

		if (assignmentData.statusMessage === "error") {
			throw new Error("Assignments query failed: " + assignmentData.error);
		}
		if (taxonomyData.statusMessage === "error") {
			throw new Error("Taxonomies query failed: " + taxonomyData.error);
		}
		if (sampleData.statusMessage === "error") {
			throw new Error("Samples query failed: " + sampleData.error);
		}

		//parse responses to properly type objects
		const assignments: {
			featureid: AssignmentModel["featureid"];
			taxonomy: AssignmentModel["taxonomy"];
			percent_id: AssignmentModel["percent_id"];
			Occurrences: {
				organismQuantity: OccurrenceModel["organismQuantity"];
				Library: {
					id: LibraryModel["id"];
				};
			}[];
		}[] = assignmentData.result.map((r: unknown) => AssignmentResultSchema.parse(r));

		const taxonomies: TaxonomyModel[] = taxonomyData.result.map((r: unknown) => TaxonomyPartialSchema.parse(r));

		const samples: (SampleModel & { Libraries: { id: LibraryModel["id"]; lib_id: LibraryModel["lib_id"] }[] })[] =
			sampleData.result.map((r: unknown) => SampleResultSchema.parse(r));

		//convert to proper formats
		const taxaInAssignData = new Set() as Set<AssignmentModel["taxonomy"]>;
		const libsInAssignData = new Set() as Set<LibraryModel["id"]>;
		for (const assign of assignments) {
			taxaInAssignData.add(assign.taxonomy);
			for (const occ of assign.Occurrences) libsInAssignData.add(occ.Library.id);
		}

		const taxaInTaxaData = new Set() as Set<AssignmentModel["taxonomy"]>;
		const taxonomiesByName = Object.fromEntries(
			taxonomies
				.filter((taxa) => taxaInAssignData.has(taxa.taxonomy))
				.map((taxa) => {
					taxaInTaxaData.add(taxa.taxonomy);
					return [taxa.taxonomy, taxa];
				})
		);
		const libsInSampleData = new Set() as Set<LibraryModel["id"]>;
		const libsWithSampleById = new Map(
			samples.flatMap((samp) =>
				samp.Libraries.filter((lib) => libsInAssignData.has(lib.id)).map((lib) => {
					libsInSampleData.add(lib.id);
					return [lib.id, { ...lib, Sample: samp }];
				})
			)
		);

		const filteredAssigns = assignments.reduce(
			(acc, assign) => {
				//might always be true
				if (taxaInTaxaData.has(assign.taxonomy)) {
					const filteredOccs = assign.Occurrences.filter((occ) => libsInSampleData.has(occ.Library.id));

					//should always be true
					if (filteredOccs.length) {
						acc.push({ ...assign, Occurrences: filteredOccs });
					}
				}

				return acc;
			},
			[] as typeof assignments
		);

		return {
			assignments: filteredAssigns,
			taxonomiesByName,
			libsWithSampleById
		};
	}, [data]);

	if (error) {
		throw new Error("Taxonomy query failed to reach the server.");
	}

	return (
		<TaxonomyVisualize
			assignsWithOccs={assignments}
			taxonomiesByName={taxonomiesByName}
			libsWithSampleById={libsWithSampleById}
			pathnamePrefix={pathnamePrefix}
			loading={isLoading}
		/>
	);
}
