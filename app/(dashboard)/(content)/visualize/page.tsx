import DateDepthScatterPlot from "@/app/components/charts/DateDepthScatterPlot";
import LibraryTaxaBarChart from "@/app/components/charts/LibraryTaxaBarChart";
import SearchUI from "@/app/components/search/SearchUI";
import { Library, Occurrence, Prisma, Sample, Taxonomy } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { parseApiQuery } from "@/app/helpers/queries";
import { SampleScalarFieldEnumSchema } from "@/prisma/generated/zod";
import { DeadValueNumbers } from "@/types/enums";
import { GlobalOmit } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";
import { Suspense } from "react";

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

export default async function SearchLayout({
	searchParams
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = await searchParams;

	return (
		<>
			<SearchUI noTable />
			<Suspense>
				<SuspenseDateDepthScatter params={params} />
			</Suspense>
			<Suspense>
				<SuspenseLibraryTaxaBar params={params} />
			</Suspense>
		</>
	);
}

async function SuspenseDateDepthScatter({ params }: { params: { [key: string]: string | string[] | undefined } }) {
	const { query } = parseApiQuery("sample", paramsPropToObj(params), {
		features: { advanced: true, shapes: true },
		swapToTable: true
	});

	const samples = await prisma.sample.findMany({
		...(query as Prisma.SampleFindManyArgs),
		orderBy: {
			eventDate: "asc"
		}
	});

	const fields = new Set(["project_id"]) as Set<keyof Sample>;
	//build fields in fieldOrder
	for (const f of TableMetadata.sample.fieldOrder!) {
		fields.add(f as keyof Sample);
	}
	for (const f of SampleScalarFieldEnumSchema.options.sort()) {
		fields.add(f);
	}

	//remove bad fields
	for (const omit of GlobalOmit) {
		fields.delete(omit as keyof Sample);
	}
	fields.delete("id");
	fields.delete("userDefined");
	fields.delete("eventDate");
	fields.delete("minimumDepthInMeters");
	fields.delete("samp_name");

	//add userDefined fields from data
	const userDefinedFields = new Set() as Set<string>;
	const points = samples.filter((samp) => {
		if (
			!DeadValueNumbers.includes(samp.eventDate.getTime()) &&
			samp.minimumDepthInMeters != null &&
			!DeadValueNumbers.includes(samp.minimumDepthInMeters)
		) {
			if (samp.userDefined) {
				for (const ud of Object.keys(samp.userDefined)) {
					userDefinedFields.add(ud);
				}
			}

			return true;
		}
	});

	return <DateDepthScatterPlot points={points} fields={fields} userDefinedFields={userDefinedFields} />;
}

async function SuspenseLibraryTaxaBar({ params }: { params: { [key: string]: string | string[] | undefined } }) {
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

	const samplesById = {} as Record<Sample["id"], Sample & { Libraries: { lib_id: Library["lib_id"] }[] }>;
	const sampleIdsByLibId = {} as Record<Library["lib_id"], Sample["id"]>;
	for (const samp of samples) {
		samplesById[samp.id] = samp;

		for (const lib of samp.Libraries) {
			sampleIdsByLibId[lib.lib_id] = samp.id;
		}
	}

	return (
		<LibraryTaxaBarChart
			occsByFeatureid={occsByFeatureid}
			assignments={assignments}
			taxonomiesById={taxonomiesById}
			samplesById={samplesById}
			sampleIdsByLibId={sampleIdsByLibId}
		/>
	);
}
