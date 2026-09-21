import DocsPageSection from "@/app/components/docs/DocsPageSection";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "FAQ | API",
	description: "Frequently asked questions about using the Ocean DNA Explorer API."
};

export default function ApiFaqPage() {
	return (
		<DocsPageSection
			page="api"
			section="faq"
			header={
				<>
					<div className="space-y-6">
						<p className="mb-4">Frequently asked questions about using the Ocean DNA Explorer API.</p>

						<div>
							<h4 className="font-medium mb-2">Q: Do I need an API key to use the Ocean DNA Explorer API?</h4>
							<p>
								A: No, the Ocean DNA Explorer API is currently open and does not require authentication or API keys.
							</p>
						</div>

						<div>
							<h4 className="font-medium mb-2">Q: Are there rate limits for API usage?</h4>
							<p>
								A: 20 requests every 10 seconds, per IP address, on any path starting with /api. /api/internal is not
								counted. Over the limit you get HTTP 429. Details are in{" "}
								<Link className="link link-primary font-semibold" href="/docs/api/introduction#rate-limits">
									Rate Limits
								</Link>
								.
							</p>
						</div>

						<div>
							<h4 className="font-medium mb-2">Q: I&apos;m not familiar with APIs. How do I get started?</h4>
							<p>
								A: An API (Application Programming Interface) allows computers or programs to send data to one another.
								To use our API, you&apos;ll need to make HTTP requests to our endpoints. The simplest way to start is by
								following our{" "}
								<Link className="link link-primary font-semibold" href="/docs/api/introduction#how-to-use-api">
									4-Step Guide
								</Link>
								, then copying one of the{" "}
								<Link className="link link-primary font-semibold" href="/docs/api/recipes">
									Common Queries
								</Link>
								.
							</p>
						</div>

						<div>
							<h4 className="font-medium mb-2">Q: Why does the API return more records than the website?</h4>
							<p>
								A: The website shows trusted data by default and the API does not. Add{" "}
								<Link className="link link-primary font-semibold" href="/docs/api/queryParameters#trusted-data">
									trusted=true
								</Link>{" "}
								to match it. Note that if you paste a URL into a browser, the trusted toggle from the website overrides
								the option, because your browser sends its cookie along with the request.
							</p>
						</div>

						<div>
							<h4 className="font-medium mb-2">Q: My query returns an error. How do I find out why?</h4>
							<p>
								A: The data endpoints report every rejected query with the same generic message, so the text will not
								tell you much. Work through the{" "}
								<Link className="link link-primary font-semibold" href="/docs/api/responses#common-errors">
									common errors
								</Link>{" "}
								list instead. The usual causes are a misspelled field name, an option the route does not accept, or two
								filter types used at once.
							</p>
						</div>

						<div>
							<h4 className="font-medium mb-2">Q: Why is /api/project/5 not the project with project_id 5?</h4>
							<p>
								A: The number in the path is the internal database ID, not a name from the data. To look a record up by
								a name you already know, filter on the table endpoint instead, such as{" "}
								<Link className="link link-primary font-semibold" href="/docs/api/searching#direct-field-filtering">
									/api/project?project_id=gomecc4
								</Link>
								.
							</p>
						</div>

						<div>
							<h4 className="font-medium mb-2">Q: How do I report issues with the API?</h4>
							<p>
								A: Please submit any API issues through our GitHub repository&apos;s{" "}
								<Link className="link link-primary font-semibold" href="https://github.com/aomlomics/node/issues">
									issue tracker
								</Link>
								.
							</p>
						</div>

						<div>
							<h4 className="font-medium mb-2">Q: How do I cite data obtained through the API?</h4>
							<p>
								A: Please cite the Ocean DNA Explorer and the specific projects from which you obtained data. Each
								project has citation information available in fields like project_id, project_contact, institution, and
								institutionID.
							</p>
						</div>
					</div>
				</>
			}
		/>
	);
}
