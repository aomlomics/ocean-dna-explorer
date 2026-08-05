import { prisma } from "@/app/helpers/prisma";
import { getLastModifiedDate } from "@/app/helpers/utils";
import { MetadataRoute } from "next";

const URL_LIMIT = 50000; // Google's limit is 50,000 URLs per sitemap

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
			taxonomy: true
		},
		skip,
		take: URL_LIMIT
	});

	//use first day of month instead of actual submission date because it's too expensive
	const date = new Date();
	const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
	return taxonomies.map((taxa) => ({
		url: `${process.env.NEXT_PUBLIC_URL}/explore/taxonomy/${encodeURIComponent(taxa.taxonomy)}`,
		lastModified: firstDayOfMonth
	}));
}
