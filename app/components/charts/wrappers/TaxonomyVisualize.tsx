"use client";

import { DeadValueEnum } from "@/types/enums";
import type { SampleModel } from "@/app/generated/prisma/models";
import { getZodType } from "@/app/helpers/schema";
import { GlobalOmit, type TaxonomicRanks } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";
import { SampleScalarFieldEnumSchema } from "@/prisma/generated/zod";
import dynamic from "next/dynamic";
const TaxaBarChart = dynamic(() => import("../TaxaBarChart"), {
	ssr: false
});

export const DEFAULT_RANK = "kingdom" as (typeof TaxonomicRanks)[0];

export default function TaxonomyVisualize({
	featuresById,
	taxonomiesByName,
	sampleByLibId
}: {
	featuresById: Record<
		string,
		{
			taxonomy: string;
			occurrences: {
				lib_id: string;
				organismQuantity: number;
			}[];
		}
	>;
	taxonomiesByName: Record<
		string,
		Record<(typeof TaxonomicRanks)[number], string | null> & {
			taxonomy: string;
		}
	>;
	sampleByLibId: Record<string, SampleModel>;
}) {
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

	for (const sample of Object.values(sampleByLibId)) {
		//check if fields have values
		for (const f of sampFields) {
			const key = f as keyof SampleModel;

			if (!fieldsWithValues.has(f) && sample[key] != null) {
				const type = getZodType("sample", key).type;

				if (type !== "boolean") {
					if (type === "date" && !((sample[key] as Date).getTime() in DeadValueEnum)) {
						fieldsWithValues.add(f);
					} else if (!((sample[key] as string | number) in DeadValueEnum)) {
						fieldsWithValues.add(f);
					}
				}
			}
		}

		//add userDefined fields
		if (sample.userDefined) {
			for (const ud in sample.userDefined) {
				if (
					sample.userDefined[ud] != null &&
					!(sample.userDefined[ud] in DeadValueEnum) &&
					sample.userDefined[ud] !== ""
				) {
					sampFields.add(ud);
					fieldsWithValues.add(ud);
					userDefinedFields.add(ud);
				}
			}
		}
	}

	return (
		<TaxaBarChart
			featuresById={featuresById}
			taxonomiesByName={taxonomiesByName}
			sampleByLibId={sampleByLibId}
			sampFields={Array.from(sampFields)}
			userDefinedFields={userDefinedFields}
		/>
	);
}
