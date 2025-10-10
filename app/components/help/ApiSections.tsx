import { ReactNode } from "react";
import CodeBlock from "./CodeBlock";
import InlineCode from "./InlineCode";
import SchemaDisplay from "../SchemaDisplay";
import { prisma } from "@/app/helpers/prisma";
import ApiCodeBlock from "./ApiCodeBlock";
import Link from "next/link";
import ThemeAwareSvg from "./ThemeAwareSvg";
import Image from "next/image";
import ApiQueryDiagram from "./ApiQueryDiagram";

// Define types for our content structure
export type Subsection = {
	id: string; // Used for anchor links and React keys
	title: string; // Display text in navigation and headings
	content: ReactNode; // Allows JSX content
};

export type Section = {
	id: string;
	title: string;
	content: ReactNode;
	subsections?: Subsection[]; // Optional array of subsections
};

export async function getApiSections() {
	const [taxonomy, project] = await prisma.$transaction([
		prisma.taxonomy.findFirst({
			select: {
				id: true
			}
		}),
		prisma.project.findFirst({
			select: {
				id: true
			}
		})
	]);

	return [
		{
			id: "introduction",
			title: "Introduction",
			content: (
				<div className="space-y-4">
					<p>
						The ODE API provides programmatic access to marine eDNA data. This documentation will help you understand
						how to use the API to query and retrieve data from the Ocean DNA Explorer.
					</p>
					<p>
						Our API is designed to be straightforward. All you need is a web browser or a simple script to start
						fetching data—no authentication is required.
					</p>
				</div>
			),
			subsections: [
				{
					id: "how-to-use-api",
					title: "Making Your First API Query",
					content: (
						<div className="space-y-8 mt-10">
							{/* Step 1 */}
							<div className="flex items-start space-x-6 p-6 rounded-lg">
								<div className="flex-shrink-0">
									<div className="flex items-center justify-center h-16 w-16 rounded-lg bg-primary/10 text-primary border-2 border-base-content/20 shadow-sm">
										<span className="text-3xl font-bold">1</span>
									</div>
								</div>
								<div>
									<h4 className="text-xl font-semibold leading-6 mb-2">Find the Data You Need</h4>
									<p>
										Before you can ask for data, you need to know what's available. The best place to start is
										our{" "}
										<Link href="#database-schema" className="link link-primary">
											Database Schema
										</Link>
										. The <strong>Entity Relationship Diagram (ERD)</strong> is a map of the database that shows
										you what tables are available and how they are linked together.
									</p>
									<p className="mt-2">
										Once you know which table you're interested in (e.g., `Project`), look at the{" "}
										<Link href="#table-definitions" className="link link-primary">
											Table Definitions
										</Link>{" "}
										to find the exact names of the data columns, or <strong>fields</strong>, that you can use in
										your queries.
									</p>
								</div>
							</div>

							{/* Step 2 */}
							<div className="flex items-start space-x-6 p-6 rounded-lg">
								<div className="flex-shrink-0">
									<div className="flex items-center justify-center h-16 w-16 rounded-lg bg-primary/10 text-primary border-2 border-base-content/20 shadow-sm">
										<span className="text-3xl font-bold">2</span>
									</div>
								</div>
								<div>
									<h4 className="text-xl font-semibold leading-6 mb-2">Build a Basic Query</h4>
									<p>
										The simplest query just retrieves data from a single table. Start with the table name (the{" "}
										<strong>endpoint</strong>) and add <strong>parameters</strong> after the `?` to refine your
										search. For example, you can limit the number of results or specify which fields to return.
									</p>
									<ApiQueryDiagram
										baseUrl={`${process.env.NEXT_PUBLIC_URL}`}
										endpoint={{
											value: "/api/project",
											label: "Get data from the Project table",
											colorClass: "text-white"
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
								<div className="flex-shrink-0">
									<div className="flex items-center justify-center h-16 w-16 rounded-lg bg-primary/10 text-primary border-2 border-base-content/20 shadow-sm">
										<span className="text-3xl font-bold">3</span>
									</div>
								</div>
								<div>
									<h4 className="text-xl font-semibold leading-6 mb-2">Combine Data with Relations</h4>
									<p>
										This is the most powerful feature of the API. Instead of fetching a project, then making a{" "}
										<em>separate</em> request to find its samples, you can get it all in one go. By adding the{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">relations</code> parameter, you're telling
										the API: "also give me the data from the related table."
									</p>
									<p className="mt-2">
										In the example below, we get a specific project and also retrieve all the data from the{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">Samples</code> table that are linked to it.
									</p>
									<ApiQueryDiagram
										baseUrl={`${process.env.NEXT_PUBLIC_URL}`}
										endpoint={{ value: `/api/project`, label: "Endpoint", colorClass: "text-white" }}
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
								<div className="flex-shrink-0">
									<div className="flex items-center justify-center h-16 w-16 rounded-lg bg-primary/10 text-primary border-2 border-base-content/20 shadow-sm">
										<span className="text-3xl font-bold">4</span>
									</div>
								</div>
								<div>
									<h4 className="text-xl font-semibold leading-6 mb-2">Make the Request</h4>
									<p>
										Pasting the URL in your browser is a great way to quickly test a query. The text you see is in
										JSON format, a standard way for computers to exchange data. The{" "}
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
							<div className="mb-4 mt-4">Python (+ Pandas) example:</div>
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
    # Parse JSON response and print it
    data = response.json()
    results = data.get("result", []) # Use .get() for safety
    print("JSON Response:")
    print(json.dumps(results, indent=2))

    # Convert to DataFrame and print it
    if results:
        df = pd.DataFrame(results)
        print("--------------------")
        print("DataFrame:")
        print(df)
    else:
        print("No results found.")
else:
    print(f"Error: {response.status_code} - {response.reason}")
    try:
        # Try to parse and print the error message from the API
        error_data = response.json()
        print(f"Error message: {error_data.get('error', 'No error message provided.')}")
    except json.JSONDecodeError:
        print("Could not parse error response as JSON.")`}
							/>

							<div className="mb-4 mt-4">R example:</div>
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
  
  if (length(results) > 0) {
    print(results)
  } else {
    print("No results found.")
  }
  
} else {
  print(paste("Error:", http_status(response)$reason))
  
  # Try to parse and print error message
  error_content <- content(response, "parsed")
  if (!is.null(error_content$error)) {
    print(paste("Error message:", error_content$error))
  } else {
    print("No detailed error message provided in response.")
  }
}`}
							/>
						</>
					)
				}
			]
		},
		{
			id: "database-schema",
			title: "Database Schema",
			content: (
				<>
					<p className="mb-4">
						This is a simplified database diagram which shows the relationships between tables in the database. The
						fields available for each table are listed in the Table Definitions section beneath the diagram. This will
						help you effectively{" "}
						<a href="#relations" className="text-primary">
							query relations across tables
						</a>{" "}
						and
						<a href="#query-parameter-syntax" className="text-primary">
							{" "}
							filter by fields
						</a>
						.
					</p>
				</>
			),
			subsections: [
				{
					id: "entity-relationship-diagram",
					title: "Entity Relationship Diagram",
					content: (
						<>
							<p className="mb-4">The following diagram shows the relationships between tables in the database:</p>

							<div className="p-4 rounded-md mb-4 bg-base-200">
								<div className="relative w-full h-[800px]">
									<Image fill src="/images/ERD.svg" alt="Database entity relationship diagram" />
									<Image
										src="/images/ERD-Notation.PNG"
										alt="ERD notation key"
										width="279"
										height="137"
										className="h-1/5 w-auto absolute left-0 bottom-0 pl-6 pb-6"
									/>
								</div>
							</div>

							<p className="mb-4">
								Use this diagram as a reference when constructing queries with the{" "}
								<a href="#relations" className="text-primary">
									relations
								</a>{" "}
								parameter.
							</p>
						</>
					)
				},
				{
					id: "table-definitions",
					title: "Table Definitions",
					content: (
						<>
							<p className="mb-4">
								The dropdown menus below show the fields available for each table in ODE. You can use this information
								in your API requests to query and filter on specific fields.
							</p>
							<SchemaDisplay />
						</>
					)
				},
				{
					id: "editHistoryType",
					title: "Edit History",
					content: (
						<>
							<div className="my-4">
								<p className="mb-2">
									When a submission is edited via the{" "}
									<Link href="/mySubmissions" className="link link-primary link-hover">
										My Submissions
									</Link>{" "}
									page, a record of the changes is stored in the `editHistory` field. This field contains a JSON
									array of objects, where each object represents a set of edits made at a specific time.
								</p>
								<p className="mb-4">
									Note: While the example shows an `id` for each edit, this is for illustrative purposes. The
									current implementation does not yet include a unique ID for each edit record.
								</p>
							</div>
							<h4 className="font-medium mb-2">Structure of an Edit Record:</h4>
							<CodeBlock
								language="json"
								code={`{
	"id": "a1b2c3d4-e5f6-7890-1234-567890abcdef", // Unique identifier for the edit
	"dateEdited": "2025-10-26T14:30:00Z",
	"changes": [
		{
			"field": "project_name",
			"oldValue": "Initial Project Name",
			"newValue": "Updated Project Name"
		},
		{
			"field": "institution",
			"oldValue": "University of Science",
			"newValue": "Institute of Technology"
		}
	]
}`}
							/>
						</>
					)
				}
			]
		},
		{
			id: "api-endpoints",
			title: "API Endpoints",
			content: (
				<>
					<p className="mb-4">This section documents all available API endpoints and their functionality.</p>
				</>
			),
			subsections: [
				{
					id: "get-all-tables",
					title: "Get All Tables",
					content: (
						<>
							<div className="mb-4">Endpoint: /api/tables</div>

							<p className="mb-4">
								Returns a list of all available tables in the database. Use this to discover what data is available
								through the API.
							</p>

							<div className="mb-4">
								Example URL: <InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/tables`} />
							</div>

							<p className="mb-4">Example Response:</p>
							<ApiCodeBlock language="json" url={`${process.env.NEXT_PUBLIC_URL}/api/tables`} />
						</>
					)
				},
				{
					id: "get-table-relations",
					title: "Get Table Relations",
					content: (
						<>
							<div className="mb-4">Endpoint: /api/[table]/relations</div>

							<p className="mb-4">Returns a list of all relations for a table in the database.</p>

							<div className="mb-4">
								Example URL: <InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/project/relations`} />
							</div>

							<p className="mb-4">Example Response:</p>
							<ApiCodeBlock language="json" url={`${process.env.NEXT_PUBLIC_URL}/api/project/relations`} />
						</>
					)
				},
				{
					id: "get-table-fields",
					title: "Get Table Fields",
					content: (
						<>
							<div className="mb-4">Endpoint: /api/[table]/fields</div>

							<div className="mb-4 mt-4">
								Example URL: <InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/primer/fields`} />
							</div>

							<p className="mb-4">Example Response:</p>
							<ApiCodeBlock language="json" url={`${process.env.NEXT_PUBLIC_URL}/api/primer/fields`} />
						</>
					)
				},
				{
					id: "get-unique-field-values",
					title: "Get Unique Field Values",
					content: (
						<>
							<div className="mb-4">Endpoint: /api/[table]/fields/[fieldName]</div>

							<p className="mb-4">
								Returns all unique values for a specific field in a table. This is useful for discovering what values
								exist in a particular field that has lots of duplicate values.
							</p>

							<div className="mb-4 mt-4">
								Example URL: <InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/sample/fields/geo_loc_name`} />
							</div>

							<p className="mb-4">Example Response:</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/sample/fields/geo_loc_name`}
								defaultClosed={true}
							/>
						</>
					)
				},
				{
					id: "query-table-data",
					title: "Query Table Data",
					content: (
						<>
							<div className="mb-4">Endpoint: /api/[table]</div>

							<p className="mb-4">
								Returns multiple records from a specific table. This endpoint supports various query parameters for
								filtering, selecting fields, including relations, and limiting results.
							</p>

							<div className="mb-4">
								Example URL: <InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/project`} />
							</div>

							<p className="mb-4">Example Response:</p>
							<ApiCodeBlock language="json" url={`${process.env.NEXT_PUBLIC_URL}/api/project?limit=3`} defaultClosed={true} />
						</>
					)
				},
				{
					id: "get-single-record",
					title: "Get Single Record",
					content: (
						<>
							<div className="mb-4">Endpoint: /api/[table]/[id]</div>

							<div className="mb-4 mt-4">
								Example URL: <InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/taxonomy/${taxonomy?.id || 1}`} />
							</div>

							<div className="mb-4 mt-4">
								Returns a single record from a table based on its ID. This endpoint supports parameters for selecting
								specific fields and including related data.
							</div>

							<p className="mb-4">Example Response:</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/taxonomy/${taxonomy?.id || 1}`}
								defaultClosed={true}
							/>
						</>
					)
				}
			]
		},
		{
			id: "searching-and-filtering",
			title: "Searching and Filtering",
			content: (
				<>
					<p className="mb-4">
						The API offers several powerful methods for searching and filtering data. You can perform broad text-based
						searches, construct complex queries with multiple conditions, or filter records based on specific field
						values.
					</p>
					<div className="p-4 my-4 bg-warning/20 border-l-4 border-warning rounded-md">
						<h4 className="font-bold mb-2">Important Rule of Exclusivity</h4>
						<p>
							The primary search methods—<strong>Standard Search</strong> (`search`), <strong>Advanced Search</strong>{" "}
							(`advanced`), and <strong>ID Filtering</strong> (`ids`)—are mutually exclusive. You can only use{" "}
							<strong>one</strong> of these parameters in a single API request. Additionally, when using any of these
							three methods, you cannot add separate field filters (e.g., `project_name=Test`) to the same query.
						</p>
					</div>
				</>
			),
			subsections: [
				{
					id: "standard-search",
					title: "Standard Search",
					content: (
						<>
							<div className="mb-4">Parameter: `search=[query]`</div>
							<p className="mb-4">
								This is the simplest way to search. It performs a case-insensitive search across all text-based
								fields in a specified table for your query string.
							</p>
							<div className="mb-4">
								<strong>Use Case:</strong> Ideal for quick, general searches when you're not sure which specific
								field contains the information.
							</div>
							<div className="mb-4">
								Example URL:{" "}
								<InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/project?search=gomecc`} />
							</div>
							<p className="mb-2">
								This will return all projects where the string "gomecc" appears in any text field.
							</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/project?search=gomecc`}
								defaultClosed={true}
							/>
						</>
					)
				},
				{
					id: "advanced-search",
					title: "Advanced Search",
					content: (
						<div className="space-y-4">
							<p>Parameter: `advanced=[JSON_object]`</p>
							<p>
								For complex queries, the `advanced` parameter allows you to build a nested query using a JSON
								object. This enables multi-conditional filtering with `AND` and `OR` logic, as well as querying on
								related tables.
							</p>
							<div className="p-4 my-4 bg-base-200 border-l-4 border-info rounded-md">
								<h4 className="font-bold mb-2">Build Queries with the UI</h4>
								<p>
									The easiest way to generate an `advanced` query is to use the{" "}
									<Link href="/search/advanced" className="link link-primary font-semibold">
										Advanced Search page
									</Link>
									. Build your search using the visual interface, and then copy the `advanced` parameter from the
									URL it generates.
								</p>
							</div>

							<div>
								<strong>Use Case:</strong> Perfect for detailed data exploration, such as finding all samples from
								a specific location collected after a certain date.
							</div>

							<h4 className="font-medium mt-6 mb-2">JSON Structure:</h4>
							<p>
								The JSON object is an array of conditions. Nesting arrays creates an `OR` condition.
							</p>
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
								endpoint={{ value: `/api/sample`, label: "Endpoint", colorClass: "text-white" }}
								parameters={[
									{
										value: `advanced=[["geo_loc_name","contains","Atlantic"],["collection_timestamp","gte","2019-01-01"]]`,
										label: "Advanced Query",
										colorClass: "text-primary"
									}
								]}
								description={
									<>
										This query returns samples where the <strong>geo_loc_name</strong> contains "Atlantic" AND
										the <strong>collection_timestamp</strong> is on or after January 1st, 2019.
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
							<div className="mb-4">Parameter: `ids=[id1],[id2],...`</div>
							<p className="mb-4">
								Retrieves multiple records from a table by their specific IDs. Provide a comma-separated list of
								IDs.
							</p>
							<div className="mb-4">
								<strong>Use Case:</strong> Useful when you have a specific list of records you want to fetch.
							</div>
							<ApiQueryDiagram
								baseUrl={`${process.env.NEXT_PUBLIC_URL}`}
								endpoint={{ value: `/api/project`, label: "Endpoint", colorClass: "text-white" }}
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
								defaultClosed={true}
							/>
						</>
					)
				},
				{
					id: "direct-field-filtering",
					title: "Direct Field Filtering",
					content: (
						<>
							<div className="mb-4">Parameter: `[fieldName]=[value]`</div>
							<p className="mb-4">
								This method allows you to filter results based on the value of one or more specific fields. This
								cannot be combined with `advanced`, `search`, or `ids` parameters.
							</p>
							<div className="mb-4">
								<strong>Use Case:</strong> Good for simple, direct filtering on one or more known fields.
							</div>
							<div className="mb-4">
								Example URL:{" "}
								<InlineCode
									code={`${process.env.NEXT_PUBLIC_URL}/api/project?project_name=gomecc&institution=noaa`}
								/>
							</div>
							<p className="mb-2">
								This query returns projects where `project_name` contains "gomecc" AND `institution` contains
								"noaa".
							</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/project?project_name=gomecc&institution=noaa`}
								defaultClosed={true}
							/>
						</>
					)
				}
			]
		},
		{
			id: "query-parameters",
			title: "Query Parameters",
			content: (
				<div className="space-y-4">
					<p>
						Query parameters allow you to customize your API requests. This section details all available parameters and
						how to use them.
					</p>
				</div>
			),
			subsections: [
				{
					id: "field-selection",
					title: "Field Selection",
					content: (
						<>
							<div className="mb-4">Parameter: fields=field1,field2,field3</div>

							<p className="mb-4">
								Specifies which fields to include in the response. When omitted, all fields are returned.
							</p>

							<div className="mb-4">
								Example URL: <InlineCode code="/api/project?fields=id,project_name,dateSubmitted" />
							</div>

							<p className="mb-4">
								This example returns only the <code className="px-1 py-0.5 bg-base-200 rounded">id</code>,{" "}
								<code className="px-1 py-0.5 bg-base-200 rounded">project_name</code>, and{" "}
								<code className="px-1 py-0.5 bg-base-200 rounded">dateSubmitted</code> fields for each project.
							</p>
						</>
					)
				},
				{
					id: "field-filtering",
					title: "Field Filtering (Legacy)",
					content: (
						<>
							<div className="mb-4">Parameter: fieldName=value</div>

							<p className="mb-4">
								Filters results to return only records where the specified field contains the provided value. For
								more details, see the{" "}
								<Link className="link link-primary" href="#direct-field-filtering">
									Direct Field Filtering
								</Link>{" "}
								section.
							</p>

							<div className="mb-4">
								Example URL: <InlineCode code="/api/project?project_name=Test" />
							</div>

							<p className="mb-4">
								This example returns all projects where the{" "}
								<code className="px-1 py-0.5 bg-base-200 rounded">project_name</code> field contains "Test".
							</p>
						</>
					)
				},
				{
					id: "relations",
					title: "Relations",
					content: (
						<div className="space-y-4">
							<p>Parameter: relations=relation1,relation2</p>
							<p>
								Includes related data from other tables in the response. The relation names must be plural and can
								be lowercase or capitalized.
							</p>
							<div className="my-8 p-4 bg-base-200/50 border-l-4 border-accent shadow-sm">
								<h5 className="font-semibold mb-2 text-accent">Why Use Relations?</h5>
								<p className="text-sm">
									Relations are powerful because they let you fetch data from multiple connected tables in a single
									API call. For instance, without relations, to get a project and all its samples, you would have
									to:
								</p>
								<ol className="list-decimal list-inside text-sm mt-2 space-y-1">
									<li>Make a first request to get the project data.</li>
									<li>
										Make a second request to the sample table, filtering by the project's ID to get the related
										samples.
									</li>
								</ol>
								<p className="text-sm mt-2">
									Relations streamline this into one efficient request, saving time and complexity.
								</p>
							</div>
						</div>
					)
				},
				{
					id: "relation-field-options",
					title: "Relation Field Options",
					content: (
						<div className="space-y-4">
							<p>Parameter: relationsAllFields=true or relationsAllFields=false</p>

							<p>
								Controls whether to include all fields on related records (true) or just their ID (false,
								default).
							</p>

							<div>
								Example URL: <InlineCode code="/api/project?relations=samples&relationsAllFields=true" />
							</div>

							<p>
								This example returns all projects along with all fields from their related samples, not just the sample
								IDs.
							</p>
						</div>
					)
				},
				{
					id: "id-filtering-parameter",
					title: "ID Filtering",
					content: (
						<>
							<div className="mb-4">Parameter: ids=1,2,4,7</div>

							<p className="mb-4">
								Filters results to return only records with the specified IDs. See the{" "}
								<Link className="link link-primary" href="#id-filtering">
									ID Filtering
								</Link>{" "}
								section for more information.
							</p>
						</>
					)
				},
				{
					id: "result-limiting",
					title: "Result Limiting",
					content: (
						<div className="space-y-4">
							<p>Parameter: limit=number</p>
							<p>Limits the number of results returned. Must be a positive number.</p>
							<div>
								Example URL: <InlineCode code="/api/project?limit=20" />
							</div>
							<p>This example limits the results to 20 projects.</p>
						</div>
					)
				},
				{
					id: "relations-result-limiting",
					title: "Relations Result Limiting",
					content: (
						<div className="space-y-4">
							<p>Parameter: relationsLimit=number</p>
							<p>
								Limits the number of results returned when the{" "}
								<Link className="link link-primary" href="#relations">
									Relations
								</Link>{" "}
								parameter is used. This will cause an error if the relation is not a list. Must be a positive number.
							</p>
							<div>
								Example URL: <InlineCode code="/api/project?relations=Analyses&relationsLimit=3" />
							</div>
							<p>This example limits the list of related analyses to 3.</p>
						</div>
					)
				}
			]
		},
		{
			id: "response-format",
			title: "Response Format",
			content: (
				<div className="space-y-4">
					<p>This section explains the structure of API responses so you can properly parse and use the returned data.</p>
				</div>
			),
			subsections: [
				{
					id: "success-structure",
					title: "Success Structure",
					content: (
						<>
							<p className="mb-4">Successful API responses have a consistent structure:</p>

							<CodeBlock
								language="json"
								code={`{
  "message": "Success",
  "result": [
    // Array of results or single object
  ]
}`}
							/>

							<p className="mb-4">
								The <code className="px-1 py-0.5 bg-base-200 rounded">message</code> field will always contain "Success"
								for successful requests.
							</p>

							<p className="mb-4">
								The <code className="px-1 py-0.5 bg-base-200 rounded">result</code> field will contain either:
							</p>
							<ul className="list-disc ml-6 mb-4">
								<li>An array of objects (for multiple results)</li>
								<li>A single object (for single record requests)</li>
							</ul>
						</>
					)
				},
				{
					id: "error-structure",
					title: "Error Structure",
					content: (
						<>
							<p className="mb-4">
								If a request fails, the API will return an error response with a corresponding HTTP status code.
							</p>

							<h4 className="font-medium mt-6 mb-2">Error Response Body:</h4>
							<CodeBlock
								language="json"
								code={`{
  "message": "Error",
  "error": "A description of what went wrong."
}`}
							/>
							<p className="mb-4 mt-4">
								The <code className="px-1 py-0.5 bg-base-200 rounded">error</code> field contains a human-readable
								description of the issue.
							</p>

							<h4 className="font-medium mt-8 mb-2">Common Error Examples:</h4>
							<div className="space-y-6">
								<div>
									<p className="mb-2">
										<strong>Invalid Table:</strong> Requesting a table that does not exist.
									</p>
									<InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/invalid_table`} />
									<ApiCodeBlock
										language="json"
										url={`${process.env.NEXT_PUBLIC_URL}/api/invalid_table`}
										defaultClosed={true}
									/>
								</div>

								<div>
									<p className="mb-2">
										<strong>Invalid Field:</strong> Using a field name that does not exist in a filter or field
										selection.
									</p>
									<InlineCode
										code={`${process.env.NEXT_PUBLIC_URL}/api/project?fields=non_existent_field`}
									/>
									<ApiCodeBlock
										language="json"
										url={`${process.env.NEXT_PUBLIC_URL}/api/project?fields=non_existent_field`}
										defaultClosed={true}
									/>
								</div>

								<div>
									<p className="mb-2">
										<strong>Invalid Parameter Value:</strong> Providing an incorrect value for a parameter like `limit`.
									</p>
									<InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/project?limit=invalid`} />
									<ApiCodeBlock
										language="json"
										url={`${process.env.NEXT_PUBLIC_URL}/api/project?limit=invalid`}
										defaultClosed={true}
									/>
								</div>
							</div>
						</>
					)
				}
			]
		},
		{
			id: "faq",
			title: "FAQ",
			content: (
				<>
					<div className="space-y-6">
						<p className="mb-4">Frequently asked questions about using the ODE API.</p>

						<div>
							<h4 className="font-medium mb-2">Q: Do I need an API key to use the ODE API?</h4>
							<p>A: No, the ODE API is currently open and does not require authentication or API keys.</p>
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
			)
		}
	];
}