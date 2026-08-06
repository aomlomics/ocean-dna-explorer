import DocsSections from "@/types/docsSections";

export async function GET() {
	const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://oceandnaexplorer.org";

	//get most recent Monday at midnight
	const date = new Date();
	//subtract days since Monday from current day
	date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
	date.setHours(0, 0, 0, 0);
	const iso = date.toISOString();

	return new Response(
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>${SITE_URL}</loc>
		<lastmod>${iso}</lastmod>
		<changefreq>weekly</changefreq>
	</url>
	<url>
		<loc>${SITE_URL}/explore/project</loc>
		<lastmod>${iso}</lastmod>
		<changefreq>weekly</changefreq>
	</url>
	<url>
		<loc>${SITE_URL}/explore/sample</loc>
		<lastmod>${iso}</lastmod>
		<changefreq>weekly</changefreq>
	</url>
	<url>
		<loc>${SITE_URL}/explore/assay</loc>
		<lastmod>${iso}</lastmod>
		<changefreq>weekly</changefreq>
	</url>
	<url>
		<loc>${SITE_URL}/explore/analysis</loc>
		<lastmod>${iso}</lastmod>
		<changefreq>weekly</changefreq>
	</url>
	<url>
		<loc>${SITE_URL}/explore/feature</loc>
		<lastmod>${iso}</lastmod>
		<changefreq>weekly</changefreq>
	</url>
	<url>
		<loc>${SITE_URL}/explore/taxonomy</loc>
		<lastmod>${iso}</lastmod>
		<changefreq>weekly</changefreq>
	</url>
	<url>
		<loc>${SITE_URL}/search</loc>
		<lastmod>${iso}</lastmod>
		<changefreq>weekly</changefreq>
	</url>
	<url>
		<loc>${SITE_URL}/visualize</loc>
		<lastmod>${iso}</lastmod>
		<changefreq>weekly</changefreq>
	</url>
	<url>
		<loc>${SITE_URL}/docs</loc>
		<lastmod>${iso}</lastmod>
		<changefreq>weekly</changefreq>
	</url>
	${Object.entries(DocsSections).map(([page, sections]) =>
		Object.keys(sections).map(
			(sect) => `<url>
		<loc>${SITE_URL}/docs/${page}/${sect}</loc>
		<lastmod>${iso}</lastmod>
		<changefreq>weekly</changefreq>
	</url>`
		)
	)}
	<url>
		<loc>${SITE_URL}/learn/edna101</loc>
		<lastmod>${iso}</lastmod>
		<changefreq>weekly</changefreq>
	</url>
	<url>
		<loc>${SITE_URL}/learn/impact</loc>
		<lastmod>${iso}</lastmod>
		<changefreq>weekly</changefreq>
	</url>
	<url>
		<loc>${SITE_URL}/learn/discoveries</loc>
		<lastmod>${iso}</lastmod>
		<changefreq>weekly</changefreq>
	</url>
	<url>
		<loc>${SITE_URL}/about</loc>
		<lastmod>${iso}</lastmod>
		<changefreq>weekly</changefreq>
	</url>
	<url>
		<loc>${SITE_URL}/contribute</loc>
		<lastmod>${iso}</lastmod>
		<changefreq>weekly</changefreq>
	</url>
</urlset>`,
		{ headers: { "Content-Type": "text/xml" } }
	);
}
