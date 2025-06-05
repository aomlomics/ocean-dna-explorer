/** @type {import('next-sitemap').IConfig} */

module.exports = {
	siteUrl: process.env.NEXT_PUBLIC_URL,
	outDir: "app",
	exclude: ["/sign-in/*", "/mySubmissions/*", "/submit/*", "/api/*", "/admin/*", "/explore/analysis/sitemap/*", "/explore/assay/sitemap/*", "/explore/feature/sitemap/*", "/explore/project/sitemap/*", "/explore/sample/sitemap/*", "/explore/taxonomy/sitemap/*"]
}