export async function GET(request: Request) {
	const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://oceandnaexplorer.org";

	return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>${SITE_URL}</loc>
		<lastmod>${new Date()}</lastmod>
	</url>
	<url>
		<loc>${SITE_URL}/explore/project</loc>
		<lastmod>${new Date()}</lastmod>
	</url>
	<url>
		<loc>${SITE_URL}/explore/sample</loc>
		<lastmod>${new Date()}</lastmod>
	</url>
	<url>
		<loc>${SITE_URL}/explore/assay</loc>
		<lastmod>${new Date()}</lastmod>
	</url>
	<url>
		<loc>${SITE_URL}/explore/primer</loc>
		<lastmod>${new Date()}</lastmod>
	</url>
	<url>
		<loc>${SITE_URL}/explore/analysis</loc>
		<lastmod>${new Date()}</lastmod>
	</url>
	<url>
		<loc>${SITE_URL}/explore/feature</loc>
		<lastmod>${new Date()}</lastmod>
	</url>
	<url>
		<loc>${SITE_URL}/explore/taxonomy</loc>
		<lastmod>${new Date()}</lastmod>
	</url>
	<url>
		<loc>${SITE_URL}/search</loc>
		<lastmod>${new Date()}</lastmod>
	</url>
	<url>
		<loc>${SITE_URL}/contribute</loc>
		<lastmod>${new Date()}</lastmod>
	</url>
	<url>
		<loc>${SITE_URL}/api</loc>
		<lastmod>${new Date()}</lastmod>
	</url>
	<url>
		<loc>${SITE_URL}/help</loc>
		<lastmod>${new Date()}</lastmod>
	</url>
</urlset>`;
}
