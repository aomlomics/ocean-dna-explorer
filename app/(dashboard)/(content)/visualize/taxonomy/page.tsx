import TaxonomyVisualize from "@/app/components/charts/wrappers/TaxonomyVisualize";
import {
	AssignmentFindManyArgs,
	OccurrenceFindManyArgs,
	SampleFindManyArgs,
	TaxonomyFindManyArgs
} from "@/app/generated/prisma/models";
import { prisma } from "@/app/helpers/prisma";
import { parseApiQuery } from "@/app/helpers/queries";
import { TaxonomicRanks } from "@/types/objects";

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

	console.log(0);
	const { occurrences, assignments, taxonomies, samples } = await prisma.$transaction(
		async (tx) => {
			console.log(1);
			const occurrences = await prisma.occurrence.findMany({
				...(occQuery as OccurrenceFindManyArgs),
				select: {
					lib_id: true,
					featureid: true,
					organismQuantity: true
				}
			});

			console.log(2);
			const assignments = await prisma.assignment.findMany({
				...(assignQuery as AssignmentFindManyArgs),
				select: {
					featureid: true,
					Taxonomy: {
						select: {
							id: true
						}
					}
				}
			});

			console.log(3);
			const taxonomies = await prisma.taxonomy.findMany({
				...(taxaQuery as TaxonomyFindManyArgs),
				select: TaxonomicRanks.reduce((acc, rank) => ({ ...acc, [rank]: true }), { id: true } as Record<
					(typeof TaxonomicRanks)[number],
					true
				> & { id: true })
			});

			console.log(4);
			const samples = await prisma.sample.findMany({
				...(sampleQuery as SampleFindManyArgs),
				include: {
					Libraries: {
						select: {
							lib_id: true
						}
					}
				}
			});

			console.log(5);
			return { occurrences, assignments, taxonomies, samples };
		},
		{
			timeout: 5 * 60 * 1000
		}
	);

	console.log(6);

	return (
		<TaxonomyVisualize
			key={params.toString()}
			occurrences={occurrences}
			assignments={assignments}
			taxonomies={taxonomies}
			samples={samples}
		/>
	);
}
