import DocsPageSection from "@/app/components/docs/DocsPageSection";
import Link from "next/link";

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
								A: While there are no strict rate limits currently in place, we ask that you be considerate with your
								API usage. For applications requiring high-volume requests, please contact us.
							</p>
						</div>

						<div>
							<h4 className="font-medium mb-2">Q: I'm not familiar with APIs. How do I get started?</h4>
							<p>
								A: An API (Application Programming Interface) allows computers or programs to send data to one another.
								To use our API, you'll need to make HTTP requests to our endpoints. The simplest way to start is by
								following our{" "}
								<Link className="link link-primary font-semibold" href="#how-to-use-api">
									3-Step Guide
								</Link>
								.
							</p>
						</div>

						<div>
							<h4 className="font-medium mb-2">Q: How do I report issues with the API?</h4>
							<p>
								A: Please submit any API issues through our GitHub repository's{" "}
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
