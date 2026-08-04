import { prisma } from "@/app/helpers/prisma";
import { getLastModifiedDate } from "@/app/helpers/utils";
import { MetadataRoute } from "next";

const URL_LIMIT = 50000; // Google's limit is 50,000 URLs per sitemap

export async function generateSitemaps() {
	try {
		let count = await prisma.assay.count({
			where: {
				Analyses: {
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

	const assays = await prisma.assay.findMany({
		select: {
			assay_name: true,
			Analyses: {
				select: {
					dateSubmitted: true,
					editHistory: true
				}
			}
		},
		skip,
		take: URL_LIMIT
	});

	return assays.reduce((acc, a) => {
		if (a.Analyses.length) {
			acc.push({
				url: `${process.env.NEXT_PUBLIC_URL}/explore/assay/${encodeURIComponent(a.assay_name)}`,
				lastModified: a.Analyses.reduce((latest, curr) => {
					const currLast = getLastModifiedDate(curr);
					return currLast > latest ? currLast : latest;
				}, getLastModifiedDate(a.Analyses[0]))
			});
		}

		return acc;
	}, [] as MetadataRoute.Sitemap);
}
