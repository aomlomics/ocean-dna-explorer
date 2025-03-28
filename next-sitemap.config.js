module.exports = {
	siteUrl: process.env.NEXT_PUBLIC_URL,
	exclude: ["/sign-in", "/mySubmissions", "/submit/*", "/api/analysisFile/*", "/api/pagination/*", "/api/sampleLocations"],
	generateRobotsTxt: true,
	robotsTxtOptions: {
		policies: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/sign-in/", "/mySubmissions/", "/submit/", "/api/analysisFile/", "/api/sampleLocations/", "/api/pagination/"]
			}
		]
	}
}