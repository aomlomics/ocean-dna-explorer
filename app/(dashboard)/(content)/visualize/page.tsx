import SampleScatterPlot from "@/app/components/charts/SampleScatterPlot";
import TaxaBarChart from "@/app/components/charts/TaxaBarChart";
import SearchUI from "@/app/components/search/SearchUI";
import { Library, Occurrence, Prisma, Sample, Taxonomy } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { parseApiQuery } from "@/app/helpers/queries";
import { SampleScalarFieldEnumSchema, SampleSchema } from "@/prisma/generated/zod";
import { DeadValueEnum } from "@/types/enums";
import { GlobalOmit } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";
import { Suspense } from "react";
import { getZodType } from "@/app/helpers/schema";

function paramsPropToObj(params: { [key: string]: string | string[] | undefined }) {
	const urlParams = new URLSearchParams();
	for (const [key, val] of Object.entries(params)) {
		if (val != null) {
			if (Array.isArray(val)) {
				for (const v of val) {
					urlParams.append(key, v);
				}
			} else {
				urlParams.set(key, val);
			}
		}
	}

	return urlParams;
}

function getSampFields() {
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

	return sampFields;
}

export default async function SearchLayout({
	searchParams
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = await searchParams;

	return (
		<>
			<SearchUI noTable />

			<Suspense fallback={<>Loading...</>}>
				<SuspenseSampleScatter params={params} />
			</Suspense>

			<div className="border-t border-primary pt-3 mt-3"></div>

			<Suspense fallback={<>Loading...</>}>
				<SuspenseTaxaBar params={params} />
			</Suspense>
		</>
	);
}

async function SuspenseSampleScatter({ params }: { params: { [key: string]: string | string[] | undefined } }) {
	const { query } = parseApiQuery("sample", paramsPropToObj(params), {
		features: { advanced: true, shapes: true },
		swapToTable: true
	});

	const samples = await prisma.sample.findMany({
		...(query as Prisma.SampleFindManyArgs)
	});

	const fields = getSampFields();

	const xyFields = new Set(["eventDate", "minimumDepthInMeters"]) as Set<string>;
	const userDefinedFields = new Set() as Set<string>;
	for (const f of Array.from(fields)) {
		const key = f as keyof Sample;
		const type = getZodType(SampleSchema.shape[key]).type;

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
			const type = getZodType(SampleSchema.shape[key]).type;
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

async function SuspenseTaxaBar({ params }: { params: { [key: string]: string | string[] | undefined } }) {
	const { query: occQuery } = parseApiQuery("occurrence", paramsPropToObj(params), {
		features: { advanced: true, shapes: true },
		swapToTable: true
	});
	const { query: assignQuery } = parseApiQuery("assignment", paramsPropToObj(params), {
		features: { advanced: true, shapes: true },
		swapToTable: true
	});
	const { query: taxaQuery } = parseApiQuery("taxonomy", paramsPropToObj(params), {
		features: { advanced: true, shapes: true },
		swapToTable: true
	});
	const { query: sampleQuery } = parseApiQuery("sample", paramsPropToObj(params), {
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

	const sampFields = getSampFields();
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
