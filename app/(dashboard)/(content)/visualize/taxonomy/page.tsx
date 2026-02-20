import TaxaBarChart from "@/app/components/charts/TaxaBarChart";
import { Library, Occurrence, Prisma, Sample, Taxonomy } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { parseApiQuery } from "@/app/helpers/queries";
import { getZodType } from "@/app/helpers/schema";
import { SampleScalarFieldEnumSchema, SampleSchema } from "@/prisma/generated/zod";
import { DeadValueEnum } from "@/types/enums";
import { GlobalOmit } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";

export default async function VisualizeTaxonomy({
	searchParams
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = new URLSearchParams();

	for (const [key, val] of Object.entries(await searchParams)) {
		if (val != null) {
			if (Array.isArray(val)) {
				for (const v of val) {
					params.append(key, v);
				}
			} else {
				params.set(key, val);
			}
		}
	}

	const { query: occQuery } = parseApiQuery("occurrence", params, {
		features: { advanced: true, shapes: true },
		swapToTable: true
	});
	const { query: assignQuery } = parseApiQuery("assignment", params, {
		features: { advanced: true, shapes: true },
		swapToTable: true
	});
	const { query: taxaQuery } = parseApiQuery("taxonomy", params, {
		features: { advanced: true, shapes: true },
		swapToTable: true
	});
	const { query: sampleQuery } = parseApiQuery("sample", params, {
		features: { advanced: true, shapes: true },
		swapToTable: true
	});

	const [occurrences, assignments, taxonomies, samples] = await prisma.$transaction([
		prisma.occurrence.findMany({
			...(occQuery as Prisma.OccurrenceFindManyArgs),
			select: {
				lib_id: true,
				featureid: true,
				organismQuantity: true
			}
		}),
		prisma.assignment.findMany({
			...(assignQuery as Prisma.AssignmentFindManyArgs),
			select: {
				featureid: true,
				Taxonomy: {
					select: {
						id: true
					}
				}
			}
		}),
		prisma.taxonomy.findMany({
			...(taxaQuery as Prisma.TaxonomyFindManyArgs),
			omit: {
				taxonomy: true,
				verbatimIdentification: true
			}
		}),
		prisma.sample.findMany({
			...(sampleQuery as Prisma.SampleFindManyArgs),
			include: {
				Libraries: {
					select: {
						lib_id: true
					}
				}
			}
		})
	]);

	//sort occurrences by featureid
	const occsByFeatureid = {} as Record<Occurrence["featureid"], typeof occurrences>;
	for (const occ of occurrences) {
		if (occsByFeatureid[occ.featureid]) {
			occsByFeatureid[occ.featureid].push(occ);
		} else {
			occsByFeatureid[occ.featureid] = [occ];
		}
	}

	const taxonomiesById = {} as Record<Taxonomy["id"], Omit<Taxonomy, "taxonomy" | "verbatimIdentification">>;
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
				const type = getZodType(SampleSchema.shape[key]).type;

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
			key={params.toString()}
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
