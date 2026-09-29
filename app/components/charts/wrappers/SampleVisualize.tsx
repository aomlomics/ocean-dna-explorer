"use client";

import type { SampleModel } from "@/app/generated/prisma/models/Sample";
import { getZodType } from "@/app/helpers/schema";
import { SampleScalarFieldEnumSchema } from "@/prisma/generated/zod";
import { DeadValueEnum } from "@/types/enums";
import { GlobalOmit } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";
import dynamic from "next/dynamic";
const SampleScatterPlot = dynamic(() => import("../SampleScatterPlot"), {
	ssr: false
});

export const DEFAULT_X_FIELD = "eventDate" as keyof SampleModel;
export const DEFAULT_Y_FIELD = "minimumDepthInMeters" as keyof SampleModel;
export const DEFAULT_LEGEND_FIELD = "project_id" as keyof SampleModel;

export default function SampleVisualize({ samples }: { samples: SampleModel[] }) {
	const fields = new Set(["project_id"]) as Set<string>;
	//build fields in fieldOrder
	for (const f of TableMetadata.sample.fieldOrder!) {
		fields.add(f);
	}
	for (const f of SampleScalarFieldEnumSchema.options.sort()) {
		fields.add(f);
	}

	//remove bad fields
	for (const omit of GlobalOmit) {
		fields.delete(omit);
	}
	fields.delete("id");
	fields.delete("userDefined");
	fields.delete("samp_name");

	//add to xy field options
	const xyFields = new Set() as Set<string>;
	for (const f of Array.from(fields)) {
		const key = f as keyof SampleModel;
		const type = getZodType("sample", key).type;

		if (type === "integer" || type === "float" || type === "date") {
			xyFields.add(key);
		}
	}

	const fieldsWithValues = new Set<string>();
	const userDefinedFields = new Set<string>();
	const badUdXyFields = new Set<string>();

	const unmodifiedFields = Array.from(fields);
	for (const samp of samples) {
		//check if fields have values
		for (const f of unmodifiedFields) {
			if (!fieldsWithValues.has(f)) {
				const key = f as keyof SampleModel;
				if (samp[key] != null) {
					const type = getZodType("sample", key).type;

					if (
						type !== "boolean" &&
						!(type === "date"
							? (samp[key] as Date).getTime() in DeadValueEnum
							: (samp[key] as string | number) in DeadValueEnum)
					) {
						fieldsWithValues.add(f);
					}
				}
			}
		}

		//add userDefined fields
		if (samp.userDefined) {
			for (const ud in samp.userDefined) {
				if (samp.userDefined[ud] != null && !(samp.userDefined[ud] in DeadValueEnum) && samp.userDefined[ud] !== "") {
					fields.add(ud);
					userDefinedFields.add(ud);
					fieldsWithValues.add(ud);

					if (Number.isFinite(Number(samp.userDefined[ud])) || !isNaN(new Date(samp.userDefined[ud]).getTime())) {
						if (!badUdXyFields.has(ud)) {
							xyFields.add(ud);
						}
					} else {
						badUdXyFields.add(ud);
						xyFields.delete(ud);
					}
				}
			}
		}
	}

	//anything that never had a valid value gets removed
	for (const f of fields) {
		if (!fieldsWithValues.has(f)) {
			fields.delete(f);
			xyFields.delete(f);
		}
	}

	return (
		<SampleScatterPlot
			samples={samples}
			fields={Array.from(fields)}
			xyFields={Array.from(xyFields)}
			userDefinedFields={userDefinedFields}
		/>
	);
}
