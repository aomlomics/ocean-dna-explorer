import { prisma } from "@/app/helpers/prisma";
import { MetadataRoute } from "next";

export async function generateSitemaps() {
	try {
		let count = await prisma.sample.count();

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

	const samples = await prisma.sample.findMany({
		select: {
			samp_name: true
		},
		skip,
		take: 50000
	});

	return samples.map((samp) => ({
		url: `${process.env.NEXT_PUBLIC_URL}/explore/sample/${samp.samp_name}`,
		lastModified: new Date()
	}));
}
