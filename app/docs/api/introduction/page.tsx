import ApiQueryDiagram from "@/app/components/docs/ApiQueryDiagram";
import CodeBlock from "@/app/components/docs/CodeBlock";
import DocsPageSection from "@/app/components/docs/DocsPageSection";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";

export default async function ApiIntroductionPage() {
	const project = await prisma.project.findFirst({
		orderBy: {
			id: "asc"
		},
		select: {
			id: true
		}
	});

	return (
		<DocsPageSection
			page="api"
			section="introduction"
			header={
				<div className="space-y-4">
					<p className="text-base-content/90">
						You can build complex queries using the{" "}
						<Link href="/search" className="link link-primary">
							Search
						</Link>{" "}
						page user interface, then copy the URL to use as an API call in your code. This is a great way to get
						started quickly.
					</p>
					<p>
						The Ocean DNA Explorer API provides programmatic access to marine eDNA data. This documentation will help
						you understand how to use the API to query and retrieve data from the Ocean DNA Explorer.
					</p>
					<p>
						All you need is a web browser or a simple script to start fetching data. No authentication is required, and
						there are currently no usage limits, please be reasonable. Reach out to the ODE team for large data
						retrieval requests.
					</p>
				</div>
			}
			subsections={[
				{
					id: "how-to-use-api",
					title: "Making Your First API Query",
					content: (
						<div className="space-y-8 mt-10">
							{/* Step 1 */}
							<div className="flex items-start space-x-6 p-6 rounded-lg">
								<div className="shrink-0">
									<div className="flex items-center justify-center h-16 w-16 rounded-lg bg-primary/10 text-primary border-2 border-base-content/20 shadow-sm">
										<span className="text-3xl font-bold">1</span>
									</div>
								</div>
								<div>
									<h4 className="text-xl font-semibold leading-6 mb-2">Find the Data You Need</h4>
									<p>
										Before you can ask for data, you need to know what&apos;s available. The best place to start is our{" "}
										<Link href="#database-schema" className="link link-primary">
											Database Schema
										</Link>
										. The Entity Relationship Diagram (ERD) is a map of the database that shows you what tables are
										available and how they are linked together.
									</p>
									<p className="mt-2">
										Once you know which table you&apos;re interested in (e.g., Project), look at the{" "}
										<Link href="#table-definitions" className="link link-primary">
											Table Definitions
										</Link>{" "}
										to find the exact names of the data columns, or fields, that you can use in your queries.
									</p>
								</div>
							</div>

							{/* Step 2 */}
							<div className="flex items-start space-x-6 p-6 rounded-lg">
								<div className="shrink-0">
									<div className="flex items-center justify-center h-16 w-16 rounded-lg bg-primary/10 text-primary border-2 border-base-content/20 shadow-sm">
										<span className="text-3xl font-bold">2</span>
									</div>
								</div>
								<div>
									<h4 className="text-xl font-semibold leading-6 mb-2">Build a Basic Query</h4>
									<p>
										The simplest query just retrieves data from a single table. Start with the table name (the{" "}
										<strong>endpoint</strong>) and add <strong>parameters</strong> after the `?` to refine your search.
										For example, you can limit the number of results or specify which fields to return.
									</p>
									<ApiQueryDiagram
										baseUrl={`${process.env.NEXT_PUBLIC_URL}`}
										endpoint={{
											value: "/api/project",
											label: "Get data from the Project table",
											colorClass: "text-primary"
										}}
										parameters={[
											{
												value: "fields=id,project_name",
												label: "Only include the id and project_name fields",
												colorClass: "text-primary"
											},
											{ value: "limit=3", label: "Return a maximum of 3 records", colorClass: "text-primary" }
										]}
										description={
											<>
												This query asks the <strong>project</strong> table for the <strong>id</strong> and{" "}
												<strong>project_name</strong> of the first <strong>3</strong> records.
											</>
										}
									/>
								</div>
							</div>

							{/* Step 3 */}
							<div className="flex items-start space-x-6 p-6 rounded-lg">
								<div className="shrink-0">
									<div className="flex items-center justify-center h-16 w-16 rounded-lg bg-primary/10 text-primary border-2 border-base-content/20 shadow-sm">
										<span className="text-3xl font-bold">3</span>
									</div>
								</div>
								<div>
									<h4 className="text-xl font-semibold leading-6 mb-2">Combine Data with Relations</h4>
									<p>
										This is the most powerful feature of the API. Instead of fetching a project, then making a{" "}
										<em>separate</em> request to find its samples, you can get it all in one go. By adding the{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">relations</code> parameter, you&apos;re telling
										the API: &quot;also give me the data from the related table.&quot;
									</p>
									<p className="mt-2">
										In the example below, we get a specific project and also retrieve all the data from the{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">Samples</code> table that are linked to it.
									</p>
									<ApiQueryDiagram
										baseUrl={`${process.env.NEXT_PUBLIC_URL}`}
										endpoint={{ value: `/api/project`, label: "Endpoint", colorClass: "text-primary" }}
										parameters={[
											{
												value: `ids=${project?.id || 1}`,
												label: "Filter for a specific Project ID",
												colorClass: "text-primary"
											},
											{
												value: "relations=Samples",
												label: "Include the related Samples table",
												colorClass: "text-primary"
											}
										]}
										description={
											<>
												This query retrieves one specific project and includes all of its related{" "}
												<strong>Samples</strong>. See the{" "}
												<Link href="#relations" className="link link-primary">
													Relations
												</Link>{" "}
												section for more.
											</>
										}
									/>
								</div>
							</div>

							{/* Step 4 */}
							<div className="flex items-start space-x-6 p-6 rounded-lg">
								<div className="shrink-0">
									<div className="flex items-center justify-center h-16 w-16 rounded-lg bg-primary/10 text-primary border-2 border-base-content/20 shadow-sm">
										<span className="text-3xl font-bold">4</span>
									</div>
								</div>
								<div>
									<h4 className="text-xl font-semibold leading-6 mb-2">Make the Request</h4>
									<p>
										Pasting the URL in your browser is a great way to quickly test a query. The text you see is in JSON
										format, a standard way for computers to exchange data. The{" "}
										<Link href="#quick-start-code" className="link link-primary">
											Quick Start Code Examples
										</Link>{" "}
										below show you how to fetch and work with this JSON data in your own scripts.
									</p>
								</div>
							</div>
						</div>
					)
				},
				{
					id: "quick-start-code",
					title: "Quick Start Code Examples",
					content: (
						<>
							<p className="mb-4">Here are some examples of how to get data in various programming environments:</p>
							<div className="ml-4">
								<div className="mb-4 mt-4 text-lg font-medium">Python example:</div>
								<CodeBlock
									language="python"
									code={`import requests
import json
import pandas as pd

# Make API request to desired endpoint
url = "${process.env.NEXT_PUBLIC_URL}/api/project"  # <-- Replace this
response = requests.get(url)

# Check if request was successful
if response.status_code == 200:
	# Parse JSON response
	data = response.json()
	results = data.get("result", [])

	# --> Your code here

	# Example: Print as JSON
	print(json.dumps(results, indent=2))

	# Example: Convert to DataFrame
	if results:
		df = pd.DataFrame(results)
		print(df)
else:
	print(f"Error: {response.status_code} - {response.reason}")`}
								/>

								<div className="mb-4 mt-8 text-lg font-medium">R example:</div>
								<CodeBlock
									language="r"
									code={`library(httr)
library(jsonlite)

# Make API request
url <- "${process.env.NEXT_PUBLIC_URL}/api/project"  # <-- Replace this
response <- GET(url)

# Check if request was successful
if (http_status(response)$category == "Success") {
	# Parse JSON response
	data <- content(response, "text", encoding = "UTF-8") %>% fromJSON()
	results <- data$result

	# --> Your code here

	# Example: Print results
	if (length(results) > 0) {
		print(results)
	}

} else {
	print(paste("Error:", http_status(response)$reason))
}`}
								/>
							</div>
						</>
					)
				},
				{
					id: "essential-information",
					title: "Essential API Information",
					content: (
						<div className="space-y-6">
							<p className="mb-4">
								Before diving into the API, here is some essential information that will help you use it effectively:
							</p>

							<div className="space-y-6">
								<div>
									<h4 className="font-medium mb-3 text-lg">1. Ways to Access Data</h4>
									<p className="mb-3">There are multiple ways to access and explore data:</p>
									<ul className="list-disc ml-6 space-y-3">
										<li>
											<Link href="/explore/project" className="link link-primary font-semibold">
												Explore
											</Link>{" "}
											Pages : View all data from each table with filters. You can only filter on fields within the table
											you are looking at. Click on any blue data field to view the detail page for that specific record.
										</li>
										<li>
											<Link href="/search" className="link link-primary font-semibold">
												Search
											</Link>{" "}
											page : Build complex queries using data from multiple tables, allowing you to filter on both
											fields <em>and</em> relations. Filters are combined with AND logic by default. Click the + Add OR
											button to add OR conditions.
										</li>
										<li>
											<strong>Direct API Access</strong>: Paste API URLs directly in your browser (e.g.,{" "}
											<code className="px-1.5 py-0.5 bg-base-300 rounded text-sm">{`${process.env.NEXT_PUBLIC_URL}/api/project?limit=3`}</code>
											) to get JSON responses. Great for testing queries before coding.
										</li>
										<li>
											<strong>Code Examples</strong>: Use the{" "}
											<Link href="#quick-start-code" className="link link-primary">
												Quick Start Code Examples
											</Link>{" "}
											above to fetch data programmatically in Python or R for analysis and visualization.
										</li>
									</ul>
								</div>

								<div>
									<div className="mt-4 space-y-6">
										<p>Here are some examples:</p>

										<div>
											<p className="mb-2">1. Getting all DNA sequences found in a specific sample</p>
											<p className="mb-2 ml-4">
												You want to query the feature table, but also get all related occurrences:
											</p>
											<div className="ml-4 space-y-2">
												<div>
													Query the table:{" "}
													<code className="px-1.5 py-0.5 bg-base-300 rounded text-sm">/api/feature</code>
												</div>
												<div>
													Include related data:{" "}
													<code className="px-1.5 py-0.5 bg-base-300 rounded text-sm">?relations=occurrences</code>
												</div>
											</div>
										</div>

										<div>
											<p className="mb-2">2. Finding all samples collected during a specific project</p>
											<p className="mb-2 ml-4">You want to query the project table and get all its samples:</p>
											<div className="ml-4 space-y-2">
												<div>
													Query the table:{" "}
													<code className="px-1.5 py-0.5 bg-base-300 rounded text-sm">/api/project</code>
												</div>
												<div>
													Include related data:{" "}
													<code className="px-1.5 py-0.5 bg-base-300 rounded text-sm">?relations=Samples</code>
												</div>
											</div>
										</div>

										<div>
											<p className="mb-2">3. Getting all sequencing analyses for a project</p>
											<p className="mb-2 ml-4">
												You want to query the project table and include analyses (note the spelling!):
											</p>
											<div className="ml-4 space-y-2">
												<div>
													Query the table:{" "}
													<code className="px-1.5 py-0.5 bg-base-300 rounded text-sm">/api/project</code>
												</div>
												<div>
													Include related data:{" "}
													<code className="px-1.5 py-0.5 bg-base-300 rounded text-sm">?relations=Analyses</code>
												</div>
											</div>
										</div>

										<p className="mt-6">
											Pro tip: Use the{" "}
											<code className="px-1.5 py-0.5 bg-base-300 rounded text-sm">/api/❮table❯/relations</code> endpoint
											to see the exact relation names available for any table. Or check the{" "}
											<Link href="#table-definitions" className="link link-primary">
												Table Definitions
											</Link>{" "}
											section of this API documentation page.
										</p>
									</div>
								</div>

								<div>
									<h4 className="font-medium mb-3 text-lg">3. Do I Need to Sign In?</h4>
									<p className="mb-2">
										<strong>No authentication required</strong> for most features:
									</p>
									<ul className="list-disc ml-6 space-y-1 mb-3">
										<li>Using the API</li>
										<li>Using the Search page</li>
										<li>Using the Explore pages</li>
										<li>Viewing any data on the website</li>
									</ul>
									<p className="mb-3">
										<strong>You DO need to sign in</strong> and request Contributor access to submit data.
									</p>
									<p>
										While there are no strict rate limits, please be respectful with your API usage. For large-scale
										automated data pulls, please{" "}
										<Link
											href="https://github.com/aomlomics/node/issues"
											className="link link-primary"
											target="_blank"
											rel="noreferrer"
										>
											contact our development team
										</Link>
										.
									</p>
								</div>
							</div>
						</div>
					)
				}
			]}
		/>
	);
}
