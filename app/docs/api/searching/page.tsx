import ApiCodeBlock from "@/app/components/docs/ApiCodeBlock";
import ApiQueryDiagram from "@/app/components/docs/ApiQueryDiagram";
import CodeBlock from "@/app/components/docs/CodeBlock";
import DocsPageSection from "@/app/components/docs/DocsPageSection";
import InlineCode from "@/app/components/docs/InlineCode";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";

export default async function ApiSearchPage() {
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
			section="searching"
			header={
				<>
					<p className="mb-4">
						The API offers several powerful methods for searching and filtering data. You can perform broad text-based
						searches, construct complex queries with multiple conditions, or filter records based on specific field
						values.
					</p>
					<div className="my-6 px-4 py-3 bg-base-200/50 border-l-4 border-accent rounded-md shadow-sm">
						<h5 className="font-semibold mb-2 text-accent">Important Rule of Exclusivity</h5>
						<p className="text-sm">
							The primary search methods, <strong>Standard Search</strong> (`search`), <strong>Advanced Search</strong>{" "}
							(`advanced`), and <strong>ID Filtering</strong> (`ids`), are mutually exclusive. You can only use{" "}
							<strong>one</strong> of these parameters in a single API request. Additionally, when using any of these
							three methods, you cannot add separate field filters (e.g., `project_name=Test`) to the same query.
						</p>
					</div>
				</>
			}
			subsections={[
				{
					id: "standard-search",
					title: "Standard Search Parameter",
					content: (
						<>
							<div className="mb-4">Parameter: `search=&lt;query&gt;`</div>
							<p className="mb-4">
								This is the simplest way to search. It performs a case-insensitive search across all text-based fields
								in a specified table for your query string.
							</p>
							<div className="mb-4">
								<strong>Use Case:</strong> Ideal for quick, general searches when you're not sure which specific field
								contains the information.
							</div>
							<div className="mb-4">
								Example URL: <InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/project?search=gomecc`} />
							</div>
							<p className="mb-2">This will return all projects where the string "gomecc" appears in any text field.</p>
							<ApiCodeBlock language="json" url={`${process.env.NEXT_PUBLIC_URL}/api/project?search=gomecc`} />
						</>
					)
				},
				{
					id: "advanced-search",
					title: "Advanced Search Parameter",
					content: (
						<div className="space-y-4">
							<p>Query Parameter: `advanced=&lt;JSON_object&gt;`</p>
							<p>
								The `advanced` query parameter enables complex filtering with `AND`/`OR` logic and related table
								queries. Add it to your API requests as `?advanced=[...]` after the table parameter.
							</p>
							<div className="my-6 px-4 py-3 bg-base-200/50 border-l-4 border-accent rounded-md shadow-sm">
								<h5 className="font-semibold mb-2 text-accent">Build Queries with the UI</h5>
								<p className="text-sm">
									Use the{" "}
									<Link href="/search" className="link link-primary font-semibold">
										Search
									</Link>{" "}
									page to build filters through a user interface (no code necessary!), then copy the API query from the
									URL.
								</p>
							</div>

							<div>
								<strong>Use Case:</strong> Perfect for detailed data exploration, such as finding all samples from a
								specific location collected after a certain date.
							</div>

							<h4 className="font-medium mt-6 mb-2">JSON Structure:</h4>
							<p>The JSON object is an array of conditions. Nesting arrays creates an `OR` condition.</p>
							<CodeBlock
								language="json"
								code={`[
	["field_name", "query_mode", "value"],
	["related_table", "field_name", "query_mode", "value"],
	[
		// Nested array for OR conditions
		["field_name_A", "query_mode", "value_A"],
		["field_name_B", "query_mode", "value_B"]
	]
]`}
							/>

							<h4 className="font-medium mt-10 mb-2">Query Modes:</h4>
							<div>
								<p className="mb-2">The `query_mode` determines how the value is compared:</p>
								<div className="overflow-x-auto">
									<table className="table table-md table-zebra">
										<thead>
											<tr>
												<th>Query Mode</th>
												<th>Description</th>
												<th>Applies To</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td className="text-lg text-primary">contains</td>
												<td>Case-insensitive match anywhere in the text.</td>
												<td>Text</td>
											</tr>
											<tr>
												<td className="text-lg text-primary">equals</td>
												<td>Exact match.</td>
												<td>Text, Numeric, Date</td>
											</tr>
											<tr>
												<td className="text-lg text-primary">startsWith</td>
												<td>Case-insensitive match at the beginning of the text.</td>
												<td>Text</td>
											</tr>
											<tr>
												<td className="text-lg text-primary">endsWith</td>
												<td>Case-insensitive match at the end of the text.</td>
												<td>Text</td>
											</tr>
											<tr>
												<td className="text-lg text-primary">gt</td>
												<td>Greater than.</td>
												<td>Numeric, Date</td>
											</tr>
											<tr>
												<td className="text-lg text-primary">gte</td>
												<td>Greater than or equal to.</td>
												<td>Numeric, Date</td>
											</tr>
											<tr>
												<td className="text-lg text-primary">lt</td>
												<td>Less than.</td>
												<td>Numeric, Date</td>
											</tr>
											<tr>
												<td className="text-lg text-primary">lte</td>
												<td>Less than or equal to.</td>
												<td>Numeric, Date</td>
											</tr>
											<tr>
												<td className="text-lg text-primary">range</td>
												<td>Value is within the specified range (inclusive).</td>
												<td>Numeric, Date</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>

							<ApiQueryDiagram
								baseUrl={`${process.env.NEXT_PUBLIC_URL}`}
								endpoint={{ value: `/api/sample`, label: "Endpoint", colorClass: "text-primary" }}
								parameters={[
									{
										value: `advanced=[["geo_loc_name","contains","Atlantic"],["collection_timestamp","gte","2019-01-01"]]`,
										label: "Advanced Query",
										colorClass: "text-primary"
									}
								]}
								description={
									<>
										This query returns samples where the <strong>geo_loc_name</strong> contains "Atlantic" AND the{" "}
										<strong>collection_timestamp</strong> is on or after January 1st, 2019.
									</>
								}
							/>
						</div>
					)
				},
				{
					id: "id-filtering",
					title: "ID Filtering",
					content: (
						<>
							<div className="mb-4">Parameter: `ids=&lt;id1&gt;,&lt;id2&gt;,...`</div>
							<p className="mb-4">
								Retrieves multiple records from a table by their specific IDs. Provide a comma-separated list of IDs.
							</p>
							<div className="mb-4">
								<strong>Use Case:</strong> Useful when you have a specific list of records you want to fetch.
							</div>
							<ApiQueryDiagram
								baseUrl={`${process.env.NEXT_PUBLIC_URL}`}
								endpoint={{ value: `/api/project`, label: "Endpoint", colorClass: "text-primary" }}
								parameters={[
									{
										value: `ids=${project?.id || 1}`,
										label: "ID Filter",
										colorClass: "text-primary"
									}
								]}
								description={<>This query retrieves a specific project by its unique ID.</>}
							/>
							<p className="mb-2 mt-8">Example Response:</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/project?ids=${project?.id || 1}`}
							/>
						</>
					)
				},
				{
					id: "direct-field-filtering",
					title: "Direct Field Filtering",
					content: (
						<>
							<div className="mb-4">Parameter: `&lt;fieldName&gt;=&lt;value&gt;`</div>
							<p className="mb-4">
								This method allows you to filter results based on the value of one or more specific fields. This cannot
								be combined with `advanced`, `search`, or `ids` parameters.
							</p>
							<div className="mb-4">
								<strong>Use Case:</strong> Good for simple, direct filtering on one or more known fields.
							</div>
							<div className="mb-4">
								Example URL:{" "}
								<InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/project?project_name=gomecc&institution=noaa`} />
							</div>
							<p className="mb-2">
								This query returns projects where `project_name` contains "gomecc" AND `institution` contains "noaa".
							</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/project?project_name=gomecc&institution=noaa`}
							/>
						</>
					)
				}
			]}
		/>
	);
}
