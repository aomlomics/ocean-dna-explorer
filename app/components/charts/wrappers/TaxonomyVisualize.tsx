"use client";

import { DeadValueEnum } from "@/types/enums";
import { Assignment, Library, Occurrence, Sample, Taxonomy } from "../../../generated/prisma/client";
import { getZodType } from "../../../helpers/schema";
import { GlobalOmit, TaxonomicRanks } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";
import { SampleScalarFieldEnumSchema } from "@/prisma/generated/zod";
import dynamic from "next/dynamic";
const TaxaBarChart = dynamic(() => import("../TaxaBarChart"), {
	ssr: false
});

export const DEFAULT_RANK = "kingdom" as (typeof TaxonomicRanks)[0];

export default function TaxonomyVisualize({
	occurrences,
	assignments,
	taxonomies,
	samples
}: {
	occurrences: {
		lib_id: Occurrence["lib_id"];
		featureid: Occurrence["featureid"];
		organismQuantity: Occurrence["organismQuantity"];
	}[];
	assignments: {
		featureid: Assignment["featureid"];
		Taxonomy: {
			id: Taxonomy["id"];
		};
	}[];
	taxonomies: (Record<(typeof TaxonomicRanks)[number], string | null> & { id: Taxonomy["id"] })[];
	samples: (Sample & {
		Libraries: {
			lib_id: Library["lib_id"];
		}[];
	})[];
}) {
	//sort occurrences by featureid
	const occsByFeatureid = {} as Record<Occurrence["featureid"], typeof occurrences>;
	for (const occ of occurrences) {
		if (occsByFeatureid[occ.featureid]) {
			occsByFeatureid[occ.featureid].push(occ);
		} else {
			occsByFeatureid[occ.featureid] = [occ];
		}
	}

	const taxonomiesById = {} as Record<Taxonomy["id"], (typeof taxonomies)[number]>;
	for (const taxa of taxonomies) {
		taxonomiesById[taxa.id] = taxa;
	}

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

	const fieldsWithValues = new Set() as Set<string>;
	const userDefinedFields = new Set() as Set<string>;

	const samplesById = {} as Record<Sample["id"], Sample & { Libraries: { lib_id: Library["lib_id"] }[] }>;
	const sampleIdsByLibId = {} as Record<Library["lib_id"], Sample["id"]>;
	for (const samp of samples) {
		samplesById[samp.id] = samp;

		for (const lib of samp.Libraries) {
			sampleIdsByLibId[lib.lib_id] = samp.id;
		}

		//check if fields have values
		for (const f of sampFields) {
			const key = f as keyof Sample;

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
				if (samp.userDefined[ud] != null && !(samp.userDefined[ud] in DeadValueEnum) && samp.userDefined[ud] !== "") {
					sampFields.add(ud);
					fieldsWithValues.add(ud);
					userDefinedFields.add(ud);
				}
			}
		}
	}

	return (
		<TaxaBarChart
			occsByFeatureid={occsByFeatureid}
			assignments={assignments}
			taxonomiesById={taxonomiesById}
			samplesById={samplesById}
			sampleIdsByLibId={sampleIdsByLibId}
			sampFields={Array.from(sampFields)}
			userDefinedFields={userDefinedFields}
		/>
	);
}
