"use client";

import { fetcherAllSuccess } from "@/app/helpers/utils";
import { useTrusted } from "@/app/hooks/TrustedProvider";
import { TaxonomicRanks } from "@/types/objects";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import type { SuccessPacket } from "@/types/globals";
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
import TaxonomyVisualize, { type AssignsByFeatureid } from "../wrappers/TaxonomyVisualize";
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
		fetcherAllSuccess,
		{ revalidateOnFocus: false }
	);

	const { assignsByFeatureid, taxonomiesByName, libsWithSampleById } = useMemo(() => {
		if (isLoading || !data) {
			return {
				assignsByFeatureid: {},
				taxonomiesByName: {},
				libsWithSampleById: new Map()
			};
		}

		const [assignmentData, taxonomyData, sampleData] = data as [SuccessPacket, SuccessPacket, SuccessPacket];

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
		const taxaInData = new Set() as Set<AssignmentModel["taxonomy"]>;
		const libsInData = new Set() as Set<LibraryModel["id"]>;
		const assignsByFeatureid = assignments.reduce((acc, a) => {
			//filter data to match assignments
			taxaInData.add(a.taxonomy);
			for (const occ of a.Occurrences) libsInData.add(occ.Library.id);

			//combine occurrences across analyses via the featureid
			if (!acc[a.featureid]) {
				acc[a.featureid] = a;
			} else {
				acc[a.featureid]!.Occurrences.push(...a.Occurrences);
			}

			return acc;
		}, {} as AssignsByFeatureid);

		const taxonomiesByName = Object.fromEntries(
			taxonomies.filter((taxa) => taxaInData.has(taxa.taxonomy)).map((taxa) => [taxa.taxonomy, taxa])
		);
		const libsWithSampleById = new Map(
			samples.flatMap((samp) =>
				samp.Libraries.filter((lib) => libsInData.has(lib.id)).map((lib) => [lib.id, { ...lib, Sample: samp }])
			)
		);

		return {
			assignsByFeatureid,
			taxonomiesByName,
			libsWithSampleById
		};
	}, [data]);

	if (error) {
		throw new Error("Taxonomy query failed to reach the server.");
	}

	return (
		<TaxonomyVisualize
			assignsByFeatureid={assignsByFeatureid}
			taxonomiesByName={taxonomiesByName}
			libsWithSampleById={libsWithSampleById}
			pathnamePrefix={pathnamePrefix}
			loading={isLoading}
		/>
	);
}
