import ApiQueryDiagram from "@/app/components/docs/ApiQueryDiagram";
import Callout from "@/app/components/docs/Callout";
import CodeBlock from "@/app/components/docs/CodeBlock";
import DocsPageSection from "@/app/components/docs/DocsPageSection";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Introduction | API",
	description:
		"Learn how to use the Ocean DNA Explorer API to query and retrieve marine eDNA data, build queries, work with related tables, and access data programmatically."
};

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
						You can build a query on the{" "}
						<Link href="/search" className="link link-primary">
							Search
						</Link>{" "}
						page, then copy that URL and use it as an API call in your own code.
					</p>
					<p>The API is how a script or another program fetches the marine eDNA data.</p>
					<p>
						A browser is enough to try a URL, and a short script is enough to fetch the data. No account or API key is
						required. Requests are rate limited. See{" "}
						<Link href="#rate-limits" className="link link-primary">
							Rate Limits
						</Link>
						. For a large download, contact the ODE team.
					</p>
				</div>
			}
			subsections={[
				{
					id: "how-to-use-api",
					title: "Making Your First API Query",
					content: (
						<div className="mt-10 space-y-10">
							{/* Step 1 */}
							<div className="flex items-start gap-4">
								<span className="w-8 shrink-0 text-4xl font-semibold leading-none text-primary">1</span>
								<div className="min-w-0">
								<h4 className="!mt-0 mb-2 !text-xl !font-semibold">Find the Data You Need</h4>
									<p>
										The best place to start is our{" "}
										<Link href="/docs/api/schema" className="link link-primary">
											Database Schema
										</Link>
										. The Entity Relationship Diagram (ERD) is a map of the database that shows you what tables are
										available and how they are linked together. The{" "}
										<Link href="/learn" className="link link-primary">
											Learn
										</Link>{" "}
										page also shows what each table is, in a more visual way. It explains the tables themselves, not how
										they connect.
									</p>
									<p className="mt-2">
										Once you know which table you&apos;re interested in (e.g., Project), look at the{" "}
										<Link href="/docs/api/schema#table-definitions" className="link link-primary">
											Table Definitions
										</Link>{" "}
										to find the exact names of the data columns, or fields, that you can use in your queries.
									</p>
								</div>
							</div>

							{/* Step 2 */}
							<div className="flex items-start gap-4">
								<span className="w-8 shrink-0 text-4xl font-semibold leading-none text-primary">2</span>
								<div className="min-w-0">
								<h4 className="!mt-0 mb-2 !text-xl !font-semibold">Build a Basic Query</h4>
									<p>
										The simplest query retrieves data from a single table. The table name in the path is the endpoint.
									</p>
									<ApiQueryDiagram
										baseUrl={`${process.env.NEXT_PUBLIC_URL}`}
										endpoint={{
											value: "/api/project",
											label: "Get data from the Project table",
											colorClass: "text-primary"
										}}
										description="This URL is only the endpoint. It asks for the project table and does not narrow the results yet."
									/>
								</div>
							</div>

							{/* Step 3 */}
							<div className="flex items-start gap-4">
								<span className="w-8 shrink-0 text-4xl font-semibold leading-none text-primary">3</span>
								<div className="min-w-0">
								<h4 className="!mt-0 mb-2 !text-xl !font-semibold">Add Options</h4>
									<p>
										Options go after the ? and change the response.{" "}
										<Link href="/docs/api/queryParameters#field-selection" className="link link-primary">
											fields
										</Link>{" "}
										chooses which columns come back.{" "}
										<Link href="/docs/api/queryParameters#result-limiting" className="link link-primary">
											limit
										</Link>{" "}
										caps how many records you get. A query works without either one.
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
											{ value: "limit=5", label: "Return a maximum of 5 records", colorClass: "text-primary" }
										]}
										description="This query asks the project table for the id and project_name of the first 5 records."
									/>
								</div>
							</div>

							{/* Step 4 */}
							<div className="flex items-start gap-4">
								<span className="w-8 shrink-0 text-4xl font-semibold leading-none text-primary">4</span>
								<div className="min-w-0">
								<h4 className="!mt-0 mb-2 !text-xl !font-semibold">Filter the Records</h4>
									<p>
										A filter keeps records that match a value. It sits after the ? like an option, but the name is a
										field on the table. fields and limit change what comes back. A filter changes which records match.
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
												value: "project_id=gomecc4",
												label: "Only records whose project_id is gomecc4",
												colorClass: "text-primary"
											}
										]}
										description={
											<>
												See{" "}
												<Link href="/docs/api/searching" className="link link-primary">
													Filtering and Searching
												</Link>{" "}
												for text search, locations, and the other ways to filter.
											</>
										}
									/>
								</div>
							</div>

							{/* Step 5 */}
							<div className="flex items-start gap-4">
								<span className="w-8 shrink-0 text-4xl font-semibold leading-none text-primary">5</span>
								<div className="min-w-0">
								<h4 className="!mt-0 mb-2 !text-xl !font-semibold">Combine Data with Relations</h4>
									<p>
										This is the most powerful feature of the API. Instead of fetching a project, then making a{" "}
										<em>separate</em> request to find its samples, you can get it all in one go. By adding the{" "}
										<code className="mx-1 font-mono !bg-transparent !rounded-none">relations</code> parameter, you&apos;re telling
										the API: &quot;also give me the data from the related table.&quot;
									</p>
									<p className="mt-2">
										In the example below, we get a specific project and also retrieve all the data from the{" "}
										<code className="mx-1 font-mono !bg-transparent !rounded-none">Samples</code> table that are linked to it.
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
												This query retrieves one specific project and includes all of its related Samples. See the{" "}
												<Link href="/docs/api/queryParameters#relations" className="link link-primary">
													Relations
												</Link>{" "}
												section for more.
											</>
										}
									/>
								</div>
							</div>

							{/* Step 6 */}
							<div className="flex items-start gap-4">
								<span className="w-8 shrink-0 text-4xl font-semibold leading-none text-primary">6</span>
								<div className="min-w-0">
								<h4 className="!mt-0 mb-2 !text-xl !font-semibold">Make the Request</h4>
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
					id: "rate-limits",
					title: "Rate Limits",
					content: (
						<>
							<p className="mb-4">
								Any request whose path starts with <code className="mx-1 font-mono !bg-transparent !rounded-none">/api</code> counts toward a limit of{" "}
								<strong>20 requests every 10 seconds</strong>, measured per IP address. Paths under{" "}
								<code className="mx-1 font-mono !bg-transparent !rounded-none">/api/internal</code> are not counted.
							</p>
							<p className="mb-4">
								Going over the limit returns <code className="mx-1 font-mono !bg-transparent !rounded-none">429 Too Many Requests</code>. Wait for the 10 second window to
								reset, then retry. A short pause between calls in a loop is enough for normal use.
							</p>
							<p>
								Pull large tables with{" "}
								<Link href="/docs/api/queryParameters#result-limiting" className="link link-primary">
									limit and page
								</Link>{" "}
								instead of one unbounded request. We would be happy to accommodate large data retrieval requests if you
								contact the ODE team.
							</p>
						</>
					)
				},
				{
					id: "quick-start-code",
					title: "Quick Start Code Examples",
					content: (
						<>
							<div className="ml-4">
								<div className="mb-4 mt-4 text-lg font-medium">Python example:</div>
								<CodeBlock
									language="python"
									code={`import requests
import json
import pandas as pd

# Make API request to desired endpoint
url = "${process.env.NEXT_PUBLIC_URL}/api/project?fields=id,project_id,project_name&limit=5"  # <-- Replace this
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
url <- "${process.env.NEXT_PUBLIC_URL}/api/project?fields=id,project_id,project_name&limit=5"  # <-- Replace this
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
					id: "api-rules",
					title: "Rules to Know",
					content: (
						<>
							<p className="mb-4">These apply to every endpoint and explain most surprises.</p>

							<ul className="list-disc ml-6 space-y-3">
								<li>
									No sign in required. There is no API key and no account needed. See{" "}
									<Link href="#rate-limits" className="link link-primary">
										Rate Limits
									</Link>{" "}
									before you loop over requests.
								</li>
								<li>
									The API returns all data by default. The website shows only trusted data unless you change the toggle.
									The API does the opposite. Add{" "}
									<Link href="/docs/api/queryParameters#trusted-data" className="link link-primary">
										trusted=true
									</Link>{" "}
									to match what the website shows.
								</li>
								<li>
									Table names are flexible. Singular or plural, any capitalization. So{" "}
									<code className="mx-1 font-mono !bg-transparent !rounded-none">/api/sample</code> and{" "}
									<code className="mx-1 font-mono !bg-transparent !rounded-none">/api/Samples</code> are the same request.
								</li>
								<li>
									Each route accepts its own options. An option that works on one endpoint is not guaranteed to work on
									another, and unsupported options return an error. Check the{" "}
									<Link href="/docs/api/endpoints#options-by-endpoint" className="link link-primary">
										options by endpoint
									</Link>{" "}
									table.
								</li>
								<li>
									Anything unrecognized is read as a field filter. A misspelled option name fails the request, because no
									field by that name exists on the table.
								</li>
								<li>
									Record IDs are database IDs.{" "}
									<code className="mx-1 font-mono !bg-transparent !rounded-none">/api/project/5</code> looks up the{" "}
									<code className="mx-1 font-mono !bg-transparent !rounded-none">id</code> field, not{" "}
									<code className="mx-1 font-mono !bg-transparent !rounded-none">project_id</code> or any other name in the
									data.
								</li>
							</ul>

							<Callout title="The API is built for code, not the browser">
								<p>
									Pasting a URL into the address bar is a great way to test a query, with one catch. Your browser
									sends the cookie that stores the trusted toggle from the website, and that cookie overrides{" "}
									<code className="mx-1 font-mono !bg-transparent !rounded-none">trusted=true</code> in the URL.
								</p>
								<p>
									If you are testing trusted data in a browser, switch the toggle on first. Requests from Python, R,
									or any other script do not send the cookie and always behave as written.
								</p>
							</Callout>
						</>
					)
				},
				{
					id: "essential-information",
					title: "Essential API Information",
					content: (
						<div className="space-y-8">
							<div>
								<h4 className="mb-2">Ways to access data</h4>
								<p className="mb-3">There are multiple ways to access and explore data:</p>
								<ul className="list-disc ml-6 space-y-3">
									<li>
										<Link href="/explore/project" className="link link-primary">
											Explore
										</Link>{" "}
										pages: View all data from each table with filters. You can only filter on fields within the table you
										are looking at. Click on any blue data field to view the detail page for that specific record.
									</li>
									<li>
										<Link href="/search" className="link link-primary">
											Search
										</Link>{" "}
										page: Build complex queries using data from multiple tables, allowing you to filter on both fields
										and relations. Filters are combined with AND logic by default. Click the + Add OR button to add OR
										conditions.
									</li>
									<li>
										Direct API access: Paste API URLs directly in your browser (e.g.,{" "}
										<code className="mx-1 font-mono !bg-transparent !rounded-none">{`${process.env.NEXT_PUBLIC_URL}/api/project?limit=3`}</code>
										) to get JSON responses. Great for testing queries before coding.
									</li>
									<li>
										Code examples: Use the{" "}
										<Link href="#quick-start-code" className="link link-primary">
											Quick Start Code Examples
										</Link>{" "}
										above to fetch data programmatically in Python or R for analysis and visualization.
									</li>
								</ul>
							</div>

							<div>
								<h4 className="mb-2">Combining tables with relations</h4>
								<ul className="list-disc ml-6 space-y-3">
									<li>
										Getting all DNA sequences found in a specific sample. You want to query the feature table, but also
										get all related occurrences. Query the table:{" "}
										<code className="mx-1 font-mono !bg-transparent !rounded-none">/api/feature</code>. Include related
										data: <code className="mx-1 font-mono !bg-transparent !rounded-none">?relations=occurrences</code>.
									</li>
									<li>
										Finding all samples collected during a specific project. You want to query the project table and get
										all its samples. Query the table:{" "}
										<code className="mx-1 font-mono !bg-transparent !rounded-none">/api/project</code>. Include related
										data: <code className="mx-1 font-mono !bg-transparent !rounded-none">?relations=Samples</code>.
									</li>
									<li>
										Getting all sequencing analyses for a project. You want to query the project table and include its
										analyses. Query the table:{" "}
										<code className="mx-1 font-mono !bg-transparent !rounded-none">/api/project</code>. Include related
										data: <code className="mx-1 font-mono !bg-transparent !rounded-none">?relations=Analyses</code>.
									</li>
								</ul>
								<p className="mt-3">
									Use the <code className="mx-1 font-mono !bg-transparent !rounded-none">/api/❮table❯/relations</code>{" "}
									endpoint to see the exact relation names available for any table. Or check the{" "}
									<Link href="/docs/api/schema#table-definitions" className="link link-primary">
										Table Definitions
									</Link>{" "}
									section of the Database Schema page.
								</p>
							</div>

							<div>
								<h4 className="mb-2">Do I need to sign in?</h4>
								<p className="mb-2">No authentication is required for most features:</p>
								<ul className="list-disc ml-6 space-y-1 mb-3">
									<li>Using the API</li>
									<li>Using the Search page</li>
									<li>Using the Explore pages</li>
									<li>Viewing any data on the website</li>
								</ul>
								<p className="mb-3">You do need to sign in and request Contributor access to submit data.</p>
								<p>
									See{" "}
									<Link href="#rate-limits" className="link link-primary">
										Rate Limits
									</Link>{" "}
									before you script a large download. For pulls that need more than that pace, please{" "}
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
					)
				}
			]}
		/>
	);
}
