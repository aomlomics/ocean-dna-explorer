import { Sample } from "@/app/generated/prisma/client";
import { getZodType } from "@/app/helpers/schema";
import { SampleScalarFieldEnumSchema } from "@/prisma/generated/zod";
import { DeadValueEnum } from "@/types/enums";
import { GlobalOmit } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";
import SampleScatterPlot from "../SampleScatterPlot";

export default function SampleVisualize({ samples }: { samples: Sample[] }) {
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

	const xyFields = new Set(["eventDate", "minimumDepthInMeters"]) as Set<string>;
	const userDefinedFields = new Set() as Set<string>;
	for (const f of Array.from(fields)) {
		const key = f as keyof Sample;
		const type = getZodType("sample", key).type;

		//remove all fields without any values
		let hasVal = false;
		for (const samp of samples) {
			if (samp[key] !== null) {
				let isDead = false;

				if (type !== "boolean") {
					if (type === "date") {
						isDead = (samp[key] as Date).getTime() in DeadValueEnum;
					} else {
						isDead = (samp[key] as string | number) in DeadValueEnum;
					}
				}

				if (!isDead) {
					hasVal = true;
					break;
				}
			}

			//add userDefined fields
			if (samp.userDefined) {
				for (const ud in samp.userDefined) {
					if (samp.userDefined[ud] != null && !(samp.userDefined[ud] in DeadValueEnum) && samp.userDefined[ud] !== "") {
						fields.add(ud);
						userDefinedFields.add(ud);

						if (
							!isNaN(parseFloat(samp.userDefined[ud])) ||
							!isNaN(new Date(samp.userDefined[ud]) as unknown as number)
						) {
							xyFields.add(ud);
						} else if (xyFields.has(ud)) {
							xyFields.delete(ud);
						}
					}
				}
			}
		}

		if (!hasVal) {
			fields.delete(f);
		} else {
			//add to xy field options
			const type = getZodType("sample", key).type;
			if (type === "integer" || type === "float" || type === "date") {
				xyFields.add(key);
			}
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
