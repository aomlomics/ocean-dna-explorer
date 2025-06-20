import { publicPrisma } from "@/app/helpers/prisma";
import { MetadataRoute } from "next";

export async function generateSitemaps() {
	try {
		let count = await publicPrisma.primer.count();

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

	const primers = await publicPrisma.primer.findMany({
		select: {
			pcr_primer_name_forward: true,
			pcr_primer_name_reverse: true
		},
		skip,
		take: 50000
	});

	return primers.map((p) => ({
		url: `${process.env.NEXT_PUBLIC_URL}/explore/primer/${p.pcr_primer_name_forward}/${p.pcr_primer_name_reverse}`,
		lastModified: new Date()
	}));
}
