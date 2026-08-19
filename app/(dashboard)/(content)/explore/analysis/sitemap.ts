import { prisma } from "@/app/helpers/prisma";
import { getLastModifiedDate } from "@/app/helpers/utils";
import { exploreUrl } from "@/types/tableMetadata";
import { MetadataRoute } from "next";

const URL_LIMIT = 50000; // Google's limit is 50,000 URLs per sitemap

export async function generateSitemaps() {
	try {
		let count = await prisma.analysis.count();

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

	const analyses = await prisma.analysis.findMany({
		select: {
			project_id: true,
			analysis_run_name: true,
			dateSubmitted: true,
			editHistory: true
		},
		skip,
		take: URL_LIMIT
	});

	return analyses.map((a) => ({
		url:
			process.env.NEXT_PUBLIC_URL +
			exploreUrl({ table: "analysis", project_id: a.project_id, analysis_run_name: a.analysis_run_name }),
		lastModified: getLastModifiedDate(a)
	}));
}
