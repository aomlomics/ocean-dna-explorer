import { prisma } from "@/app/helpers/prisma";
import { getLastModifiedDate } from "@/app/helpers/utils";
import { MetadataRoute } from "next";

const URL_LIMIT = 50000; // Google's limit is 50,000 URLs per sitemap

export async function generateSitemaps() {
	try {
		let count = await prisma.project.count();

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

	const projects = await prisma.project.findMany({
		select: {
			project_id: true,
			dateSubmitted: true,
			editHistory: true
		},
		skip,
		take: URL_LIMIT
	});

	return projects.map((proj) => ({
		url: `${process.env.NEXT_PUBLIC_URL}/explore/project/${encodeURIComponent(proj.project_id)}`,
		lastModified: getLastModifiedDate(proj)
	}));
}
