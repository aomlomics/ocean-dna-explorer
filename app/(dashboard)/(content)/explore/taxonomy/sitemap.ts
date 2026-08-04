import { prisma } from "@/app/helpers/prisma";
import { getLastModifiedDate } from "@/app/helpers/utils";
import { MetadataRoute } from "next";

const URL_LIMIT = 1000; //getting lastmodified is expensive here, so we have to provide less per sitemap

export async function generateSitemaps() {
	try {
		let count = await prisma.taxonomy.count({
			where: {
				Assignments: {
					some: {}
				}
			}
		});

		const sitemaps = [];
		let id = 0;
		while (count > 0) {
			sitemaps.push({ id });
			count -= URL_LIMIT;
			id++;
		}

		return sitemaps;
	} catch (err) {
		console.log(err);
		return [];
	}
}

export default async function sitemap({ id }: { id: Promise<number> }): Promise<MetadataRoute.Sitemap> {
	const i = await id;
	const skip = i * URL_LIMIT;

	const taxonomies = await prisma.taxonomy.findMany({
		select: {
			taxonomy: true,
			Assignments: {
				distinct: ["analysis_run_name"],
				select: {
					Analysis: {
						select: {
							dateSubmitted: true,
							editHistory: true
						}
					}
				}
			}
		},
		skip,
		take: URL_LIMIT
	});

	return taxonomies.reduce((acc, taxa) => {
		if (taxa.Assignments.length) {
			acc.push({
				url: `${process.env.NEXT_PUBLIC_URL}/explore/taxonomy/${taxa.taxonomy}`,
				lastModified: taxa.Assignments.reduce((latest, curr) => {
					const currLast = getLastModifiedDate(curr.Analysis);
					return currLast > latest ? currLast : latest;
				}, getLastModifiedDate(taxa.Assignments[0].Analysis))
			});
		}

		return acc;
	}, [] as MetadataRoute.Sitemap);
}
