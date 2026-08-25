import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
	contentSecurityPolicy: {
		directives: {
			"img-src": [
				"data:",
				"https://services.arcgisonline.com",
				"https://images.phylopic.org",
				"https://wsrv.nl",
				"https://inaturalist-open-data.s3.amazonaws.com"
			],
			"connect-src": ["https://api.gbif.org", "https://api.phylopic.org"]
		}
	}
});

export const config = {
	matcher: [
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)",
		"/__clerk/(.*)"
	]
};
