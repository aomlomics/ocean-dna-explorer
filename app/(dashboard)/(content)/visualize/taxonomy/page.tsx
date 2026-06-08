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

	const { occurrences, assignments, taxonomies, samples } = await prisma.$transaction(
		async (tx) => {
			const occurrences = await prisma.occurrence.findMany({
				...(occQuery as OccurrenceFindManyArgs),
				select: {
					lib_id: true,
					featureid: true,
					organismQuantity: true
				}
			});

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

			const taxonomies = await prisma.taxonomy.findMany({
				...(taxaQuery as TaxonomyFindManyArgs),
				select: TaxonomicRanks.reduce((acc, rank) => ({ ...acc, [rank]: true }), { id: true } as Record<
					(typeof TaxonomicRanks)[number],
					true
				> & { id: true })
			});

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

			return { occurrences, assignments, taxonomies, samples };
		},
		{
			timeout: 3 * 60 * 1000
		}
	);

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
