import { prisma } from "@/app/helpers/prisma";
import { MetadataRoute } from "next";

export async function generateSitemaps() {
	let count = await prisma.analysis.count();

	const sitemaps = [];
	let id = 0;
	while (count > 0) {
		sitemaps.push({ id });
		count -= 50000; // Google's limit is 50,000 URLs per sitemap
		id++;
	}

	return sitemaps;
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
	const skip = id * 50000;

	const analyses = await prisma.analysis.findMany({
		select: {
			analysis_run_name: true
		},
		skip,
		take: 50000
	});

	return analyses.map((a) => ({
		url: `${process.env.NEXT_PUBLIC_URL}/explore/analysis/${a.analysis_run_name}`,
		lastModified: new Date()
	}));
}
