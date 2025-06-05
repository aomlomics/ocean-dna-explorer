import { prisma } from "@/app/helpers/prisma";
import { MetadataRoute } from "next";

export async function generateSitemaps() {
	try {
		let count = await prisma.taxonomy.count();

		const sitemaps = [];
		let id = 0;
		while (count > 0) {
			sitemaps.push({ id });
			count -= 50000; // Google's limit is 50,000 URLs per sitemap
			id++;
		}

		return sitemaps;
	} catch (err) {
		console.log(err);
		return [];
	}
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
	const skip = id * 50000;

	const taxonomies = await prisma.taxonomy.findMany({
		select: {
			taxonomy: true
		},
		skip,
		take: 50000
	});

	return taxonomies.map((taxa) => ({
		url: `${process.env.NEXT_PUBLIC_URL}/explore/taxonomy/${taxa.taxonomy}`,
		lastModified: new Date()
	}));
}
