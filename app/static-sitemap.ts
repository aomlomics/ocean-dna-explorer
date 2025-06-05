import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://oceandnaexplorer.org";

	return [
		{
			url: SITE_URL,
			lastModified: new Date()
		},
		{
			url: `${SITE_URL}/explore/project`,
			lastModified: new Date()
		},
		{
			url: `${SITE_URL}/explore/sample`,
			lastModified: new Date()
		},
		{
			url: `${SITE_URL}/explore/assay`,
			lastModified: new Date()
		},
		{
			url: `${SITE_URL}/explore/primer`,
			lastModified: new Date()
		},
		{
			url: `${SITE_URL}/explore/analysis`,
			lastModified: new Date()
		},
		{
			url: `${SITE_URL}/explore/feature`,
			lastModified: new Date()
		},
		{
			url: `${SITE_URL}/explore/taxonomy`,
			lastModified: new Date()
		},
		{
			url: `${SITE_URL}/search`,
			lastModified: new Date()
		},
		{
			url: `${SITE_URL}/contribute`,
			lastModified: new Date()
		},
		{
			url: `${SITE_URL}/api`,
			lastModified: new Date()
		},
		{
			url: `${SITE_URL}/help`,
			lastModified: new Date()
		}
	];
}
