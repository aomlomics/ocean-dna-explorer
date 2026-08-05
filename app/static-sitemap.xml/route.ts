import DocsSections from "@/types/docsSections";

export async function GET() {
	const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://oceandnaexplorer.org";
	function getSection(route?: string) {
		//get most recent Monday at midnight
		const date = new Date();
		const day = date.getDay();
		const daysSinceMonday = (day + 6) % 7;
		date.setDate(date.getDate() - daysSinceMonday);
		date.setUTCHours(0, 0, 0, 0);

		return `<url>
		<loc>${SITE_URL}${route ? (route.startsWith("/") ? route : "/" + route) : ""}</loc>
		<lastmod>${date.toISOString()}</lastmod>
		<changefreq>weekly</changefreq>
	</url>`;
	}

	return new Response(
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	${getSection()}
	${getSection("explore/project")}
	${getSection("explore/sample")}
	${getSection("explore/assay")}
	${getSection("explore/analysis")}
	${getSection("explore/feature")}
	${getSection("explore/taxonomy")}
	${getSection("search")}
	${getSection("visualize")}
	${getSection("docs")}
	${Object.entries(DocsSections).map(([page, sections]) =>
		Object.keys(sections).map((sect) => getSection(`docs/${page}/${sect}`))
	)}
	${getSection("learn?section=edna10")}
	${getSection("learn?section=impact")}
	${getSection("learn?section=discoveries")}
	${getSection("about")}
	${getSection("contribute")}
</urlset>`,
		{ headers: { "Content-Type": "text/xml" } }
	);
}
