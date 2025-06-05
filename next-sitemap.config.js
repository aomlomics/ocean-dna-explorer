/** @type {import('next-sitemap').IConfig} */

module.exports = {
	siteUrl: process.env.NEXT_PUBLIC_URL,
	outDir: "app",
	exclude: ["/sign-in/*", "/mySubmissions/*", "/submit/*", "/api/*", "/admin/*", "/**/sitemap.ts"]
}