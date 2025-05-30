/** @type {import('next-sitemap').IConfig} */

module.exports = {
	siteUrl: process.env.NEXT_PUBLIC_URL,
	exclude: ["/server-sitemap.xml", "/sign-in/*", "/mySubmissions/*", "/submit/*", "/api/*", "/admin/*"],
	generateRobotsTxt: true,
	robotsTxtOptions: {
		additionalSitemaps: [
			`${process.env.NEXT_PUBLIC_URL}/server-sitemap.xml`
		],
		policies: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/sign-in/", "/mySubmissions/", "/submit/", "/api/", "/admin/"]
			}
		]
	}
};
