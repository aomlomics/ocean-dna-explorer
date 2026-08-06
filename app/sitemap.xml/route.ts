import { generateSitemaps as getProjectSitemaps } from "@/app/(dashboard)/(content)/explore/project/sitemap";
import { generateSitemaps as getAnalysisSitemaps } from "@/app/(dashboard)/(content)/explore/analysis/sitemap";
import { generateSitemaps as getAssaySitemaps } from "@/app/(dashboard)/(content)/explore/assay/sitemap";
import { generateSitemaps as getTaxonomySitemaps } from "@/app/(dashboard)/(content)/explore/taxonomy/sitemap";

export async function GET() {
	const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://oceandnaexplorer.org";

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>
	<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
		<sitemap>
			<loc>
				${SITE_URL}/static-sitemap.xml
			</loc>
		</sitemap>
		${(await getProjectSitemaps()).map(
			(res) => `<sitemap>
			<loc>
				${SITE_URL}/explore/project/sitemap/${res.id}.xml
			</loc>
		</sitemap>`
		)}
		${(await getAssaySitemaps()).map(
			(res) => `<sitemap>
			<loc>
				${SITE_URL}/explore/assay/sitemap/${res.id}.xml
			</loc>
		</sitemap>`
		)}
		${(await getAnalysisSitemaps()).map(
			(res) => `<sitemap>
			<loc>
				${SITE_URL}/explore/analysis/sitemap/${res.id}.xml
			</loc>
		</sitemap>`
		)}
		${(await getTaxonomySitemaps()).map(
			(res) => `<sitemap>
			<loc>
				${SITE_URL}/explore/taxonomy/sitemap/${res.id}.xml
			</loc>
		</sitemap>`
		)}
	</sitemapindex>`,
		{ headers: { "Content-Type": "text/xml" } }
	);
}
