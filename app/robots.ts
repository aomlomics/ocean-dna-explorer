import type { MetadataRoute } from "next";
import { prisma } from "./helpers/prisma";

async function generateSitemapUrls() {
	const counts = await prisma.$transaction([
		prisma.project.count(),
		prisma.sample.count(),
		prisma.primer.count(),
		prisma.assay.count(),
		prisma.analysis.count(),
		prisma.feature.count(),
		prisma.taxonomy.count()
	]);

	const SITEMAP_LIMIT = 50000; // Google's limit is 50,000 URLs per sitemap
	const sitemaps = [];

	//projects
	for (let i = 0; counts[0] > 0; i++) {
		sitemaps.push(`${process.env.NEXT_PUBLIC_URL}/explore/project/sitemap/${i}.xml`);
		counts[0] -= SITEMAP_LIMIT;
	}

	//samples
	for (let i = 0; counts[1] > 0; i++) {
		sitemaps.push(`${process.env.NEXT_PUBLIC_URL}/explore/sample/sitemap/${i}.xml`);
		counts[1] -= SITEMAP_LIMIT;
	}

	//primers
	for (let i = 0; counts[2] > 0; i++) {
		sitemaps.push(`${process.env.NEXT_PUBLIC_URL}/explore/primer/sitemap/${i}.xml`);
		counts[2] -= SITEMAP_LIMIT;
	}

	//assays
	for (let i = 0; counts[3] > 0; i++) {
		sitemaps.push(`${process.env.NEXT_PUBLIC_URL}/explore/assay/sitemap/${i}.xml`);
		counts[3] -= SITEMAP_LIMIT;
	}

	//analyses
	for (let i = 0; counts[4] > 0; i++) {
		sitemaps.push(`${process.env.NEXT_PUBLIC_URL}/explore/analysis/sitemap/${i}.xml`);
		counts[4] -= SITEMAP_LIMIT;
	}

	//features
	for (let i = 0; counts[5] > 0; i++) {
		sitemaps.push(`${process.env.NEXT_PUBLIC_URL}/explore/feature/sitemap/${i}.xml`);
		counts[5] -= SITEMAP_LIMIT;
	}

	//taxonomies
	for (let i = 0; counts[6] > 0; i++) {
		sitemaps.push(`${process.env.NEXT_PUBLIC_URL}/explore/taxonomy/sitemap/${i}.xml`);
		counts[6] -= SITEMAP_LIMIT;
	}

	return sitemaps;
}

export default async function robots(): Promise<MetadataRoute.Robots> {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: ["/sign-in/", "/mySubmissions/", "/submit/", "/api/", "/admin/"]
		},
		sitemap: [`${process.env.NEXT_PUBLIC_URL}/sitemap.xml`, ...(await generateSitemapUrls())]
	};
}
