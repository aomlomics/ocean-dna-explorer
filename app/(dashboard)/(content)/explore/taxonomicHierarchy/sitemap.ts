import { prisma } from "@/app/helpers/prisma";
import { exploreUrl, getLastModifiedDate } from "@/app/helpers/utils";
import type { MetadataRoute } from "next";

const URL_LIMIT = 50000; // Google's limit is 50,000 URLs per sitemap

export async function generateSitemaps() {
	try {
		let count = await prisma.taxonomicHierarchy.count();

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

	const hierarchies = await prisma.taxonomicHierarchy.findMany({
		select: {
			project_id: true,
			analysis_run_name: true,
			taxonomy: true,
			Analysis: {
				select: {
					editHistory: true,
					dateSubmitted: true
				}
			}
		},
		skip,
		take: URL_LIMIT
	});

	return hierarchies.map((hier) => ({
		url:
			process.env.NEXT_PUBLIC_URL +
			exploreUrl({
				table: "taxonomicHierarchy",
				project_id: hier.project_id,
				analysis_run_name: hier.analysis_run_name,
				taxonomy: hier.taxonomy
			}),
		lastModified: getLastModifiedDate(hier.Analysis)
	}));
}
