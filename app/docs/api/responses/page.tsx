import ApiCodeBlock from "@/app/components/docs/ApiCodeBlock";
import Callout from "@/app/components/docs/Callout";
import CodeBlock from "@/app/components/docs/CodeBlock";
import DocsPageSection from "@/app/components/docs/DocsPageSection";
import InlineCode from "@/app/components/docs/InlineCode";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Response Format | API",
	description:
		"Learn how to interpret successful and error responses from the Ocean DNA Explorer API, including the response envelope, result shapes per endpoint, and common request errors."
};

const resultShapes = [
	{ endpoint: "/api/tables", shape: "Array of table name strings." },
	{ endpoint: "/api/deadValues", shape: "Object mapping placeholder labels to codes, and codes back to labels." },
	{ endpoint: "/api/user", shape: "Array of user objects." },
	{ endpoint: "/api/❮table❯/fields", shape: "Object keyed by field name, each with a type and an optional flag." },
	{ endpoint: "/api/❮table❯/relations", shape: "Array of objects with field, table, and type." },
	{ endpoint: "/api/❮table❯/fields/❮field❯", shape: "Array of distinct values." },
	{ endpoint: "/api/❮table❯", shape: "Array of records. Empty array when nothing matches." },
	{ endpoint: "/api/❮table❯/count", shape: "A single number." },
	{ endpoint: "/api/❮table❯/❮id❯", shape: "A single record object." }
];

export default function ApiResponsesPage() {
	return (
		<DocsPageSection
			page="api"
			section="responses"
			header={
				<div className="space-y-4">
					<p>
						Every endpoint returns JSON in the same envelope, whether the request succeeded or failed. Check{" "}
						<code className="px-1 py-0.5 bg-base-300 rounded">statusMessage</code> first, then read{" "}
						<code className="px-1 py-0.5 bg-base-300 rounded">result</code> or{" "}
						<code className="px-1 py-0.5 bg-base-300 rounded">error</code>.
					</p>
				</div>
			}
			subsections={[
				{
					id: "success-structure",
					title: "Success Structure",
					content: (
						<>
							<p className="mb-4">A successful response always has these two keys:</p>

							<p className="mb-4">
								The live examples on these pages show only{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">result</code>. A count of 3 is the number inside{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">result</code>, not the whole response.
							</p>

							<CodeBlock
								language="json"
								code={`{
	"statusMessage": "success",
	"result": [
		// array, object, or number depending on the endpoint
	]
}`}
							/>

							<p className="my-4">
								BLAST queries add two more keys at the top level:{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">BlastQueryResults</code> with the scores for each
								sequence match, and <code className="px-1 py-0.5 bg-base-300 rounded">existingBlastDate</code> with the
								date if that exact query had already been run. See{" "}
								<Link href="/docs/api/searching#blast-search" className="link link-primary">
									BLAST Search
								</Link>
								.
							</p>

							<Callout title="Check statusMessage, not the HTTP status">
								<p>
									Errors are returned with a normal 200 response and{" "}
									<code className="px-1 py-0.5 bg-base-300 rounded">&quot;statusMessage&quot;: &quot;error&quot;</code>{" "}
									in the body. Code that only checks the HTTP status will treat a failed query as a success and then
									find no <code className="px-1 py-0.5 bg-base-300 rounded">result</code> key.
								</p>
							</Callout>
						</>
					)
				},
				{
					id: "result-by-endpoint",
					title: "Result Shape by Endpoint",
					content: (
						<>
							<p className="mb-4">
								The envelope never changes, but what sits inside{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">result</code> does.
							</p>

							<div className="overflow-x-auto">
								<table className="table table-md table-zebra">
									<thead>
										<tr>
											<th>Endpoint</th>
											<th>Result</th>
										</tr>
									</thead>
									<tbody>
										{resultShapes.map((row) => (
											<tr key={row.endpoint}>
												<td className="font-mono text-sm">{row.endpoint}</td>
												<td>{row.shape}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<p className="mt-4">
								Live examples for each of these are on the{" "}
								<Link href="/docs/api/endpoints" className="link link-primary">
									API Endpoints
								</Link>{" "}
								page.
							</p>
						</>
					)
				},
				{
					id: "error-structure",
					title: "Error Structure",
					content: (
						<>
							<p className="mb-4">
								When a request fails, <code className="px-1 py-0.5 bg-base-300 rounded">result</code> is replaced by{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">error</code>, which holds a message written for a
								person to read.
							</p>

							<CodeBlock
								language="json"
								code={`{
	"statusMessage": "error",
	"error": "A description of what went wrong."
}`}
							/>

							<Callout title="Rejected queries return a generic message">
								<p>
									The table, count, and single record endpoints report every rejected query as{" "}
									<code className="px-1 py-0.5 bg-base-300 rounded">An unknown server error occurred.</code> The
									specific reason is logged on the server, not sent back to you.
								</p>
								<p>So when a query fails, work backwards from the causes listed below rather than from the message.</p>
							</Callout>

							<div className="mb-4">
								Example URL: <InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/invalid_table`} />
							</div>
							<ApiCodeBlock language="json" url={`${process.env.NEXT_PUBLIC_URL}/api/invalid_table`} />

							<p className="mt-6">
								Some endpoints do return a specific message. Asking for a field that does not exist on a table is one of
								them.
							</p>

							<div className="mb-4 mt-4">
								Example URL: <InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/sample/fields/not_a_field`} />
							</div>
							<ApiCodeBlock language="json" url={`${process.env.NEXT_PUBLIC_URL}/api/sample/fields/not_a_field`} />
						</>
					)
				},
				{
					id: "common-errors",
					title: "Common Errors",
					content: (
						<>
							<p className="mb-4">Check your URL against this list.</p>

							<div className="overflow-x-auto">
								<table className="table table-md table-zebra">
									<thead>
										<tr>
											<th>Cause</th>
											<th>What to check</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>Invalid table name</td>
											<td>
												The name in the path must be a real table. Get the list from{" "}
												<code className="px-1 py-0.5 bg-base-300 rounded">/api/tables</code>.
											</td>
										</tr>
										<tr>
											<td>Invalid field name</td>
											<td>
												Every name in <code className="px-1 py-0.5 bg-base-300 rounded">fields</code>,{" "}
												<code className="px-1 py-0.5 bg-base-300 rounded">distinct</code>,{" "}
												<code className="px-1 py-0.5 bg-base-300 rounded">orderBy</code>, or a filter must exist on the
												table. Get the list from{" "}
												<code className="px-1 py-0.5 bg-base-300 rounded">/api/❮table❯/fields</code>.
											</td>
										</tr>
										<tr>
											<td>Option not allowed here</td>
											<td>
												The option is real but this route rejects it. See{" "}
												<Link href="/docs/api/endpoints#options-by-endpoint" className="link link-primary">
													options by endpoint
												</Link>
												.
											</td>
										</tr>
										<tr>
											<td>Conflicting filters</td>
											<td>
												Field filters, <code className="px-1 py-0.5 bg-base-300 rounded">search</code>,{" "}
												<code className="px-1 py-0.5 bg-base-300 rounded">ids</code>, and{" "}
												<code className="px-1 py-0.5 bg-base-300 rounded">advanced</code> cannot be combined with each
												other.
											</td>
										</tr>
										<tr>
											<td>Missing companion option</td>
											<td>
												<code className="px-1 py-0.5 bg-base-300 rounded">page</code> requires{" "}
												<code className="px-1 py-0.5 bg-base-300 rounded">limit</code>.{" "}
												<code className="px-1 py-0.5 bg-base-300 rounded">relationsFields</code> and{" "}
												<code className="px-1 py-0.5 bg-base-300 rounded">relationsAllFields</code> require{" "}
												<code className="px-1 py-0.5 bg-base-300 rounded">relations</code>, and cannot be used together.
											</td>
										</tr>
										<tr>
											<td>Wrong value type</td>
											<td>
												<code className="px-1 py-0.5 bg-base-300 rounded">limit</code>,{" "}
												<code className="px-1 py-0.5 bg-base-300 rounded">page</code>, and{" "}
												<code className="px-1 py-0.5 bg-base-300 rounded">ids</code> take integers.{" "}
												<code className="px-1 py-0.5 bg-base-300 rounded">orderBy</code> takes a field and either asc or
												desc.
											</td>
										</tr>
										<tr>
											<td>Relation not reachable</td>
											<td>
												The table named in <code className="px-1 py-0.5 bg-base-300 rounded">relations</code> must be
												connected to the one you are querying. See the{" "}
												<Link href="/docs/api/schema" className="link link-primary">
													Database Schema
												</Link>
												.
											</td>
										</tr>
									</tbody>
								</table>
							</div>

							<p className="mt-6">
								An empty <code className="px-1 py-0.5 bg-base-300 rounded">result</code> array is not an error. It means
								the query was valid and nothing matched. If you expected rows, check whether{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">trusted=true</code> is filtering them out.
							</p>
						</>
					)
				}
			]}
		/>
	);
}
