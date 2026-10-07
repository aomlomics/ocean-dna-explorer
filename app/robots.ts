import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			disallow: [
				"/sign-in",
				"/mySubmissions",
				"/submit",
				"/admin",
				"/api",
				"/tourmaline",
				"/ambient",
				"/showcase",
				"/sponsors"
			]
		},
		sitemap: `${process.env.NEXT_PUBLIC_URL}/sitemap.xml`
	};
}
