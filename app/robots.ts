import type { MetadataRoute } from "next";

export default async function robots(): Promise<MetadataRoute.Robots> {
	return {
		rules: {
			userAgent: "*",
			allow: ["/", "/api$"],
			disallow: ["/sign-in/", "/mySubmissions/", "/submit/", "/admin/", "/api/"]
		},
		sitemap: `${process.env.NEXT_PUBLIC_URL}/sitemap.xml`
	};
}
