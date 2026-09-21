import ApiCodeBlock from "@/app/components/docs/ApiCodeBlock";
import CodeBlock from "@/app/components/docs/CodeBlock";
import DocsPageSection from "@/app/components/docs/DocsPageSection";
import InlineCode from "@/app/components/docs/InlineCode";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Common Queries | API",
	description:
		"Copy and paste Ocean DNA Explorer API queries for discovering tables, filtering records, following relations, counting results, paginating, and looking up submitters."
};

export default function ApiRecipesPage() {
	const base = process.env.NEXT_PUBLIC_URL;

	return (
		<DocsPageSection
			page="api"
			section="recipes"
			header={
				<div className="space-y-4">
					<p>
						Working queries for the tasks people ask for most often. Each one builds on the options described in{" "}
						<Link href="/docs/api/searching" className="link link-primary">
							Filtering and Searching
						</Link>{" "}
						and{" "}
						<Link href="/docs/api/queryParameters" className="link link-primary">
							Query Options
						</Link>
						.
					</p>
					<p>
						Every example returns untrusted data, which is the API default. Add <code className="px-1 py-0.5 bg-base-300 rounded">trusted=true</code> to any of them
						to match what the website shows.
					</p>
				</div>
			}
			subsections={[
				{
					id: "recipe-discover",
					title: "Discover a Table",
					content: (
						<>
							<p className="mb-4">
								Start by listing the tables, then ask one of them for its fields. The field list gives you exact
								spellings, types, and the allowed values for enums.
							</p>

							<div className="mb-4">
								Step 1, list the tables: <InlineCode code={`${base}/api/tables`} />
							</div>

							<div className="mb-4">
								Step 2, inspect one table: <InlineCode code={`${base}/api/assay/fields`} />
							</div>

							<p className="mb-4">
								Example response. Assay is used here because its field list is short. Sample has far more fields, and
								the response is the same shape.
							</p>
							<ApiCodeBlock language="json" url={`${base}/api/assay/fields`} />
						</>
					)
				},
				{
					id: "recipe-filter",
					title: "Filter and Trim a Table",
					content: (
						<>
							<p className="mb-4">
								Filter on a field, then keep the response small by asking for only the fields you need. Text filters
								match anywhere in the value and ignore capitalization.
							</p>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode code={`${base}/api/project?institution=noaa&fields=project_id,project_name,institution&limit=5`} />
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock
								language="json"
								url={`${base}/api/project?institution=noaa&fields=project_id,project_name,institution&limit=5`}
							/>
						</>
					)
				},
				{
					id: "recipe-related",
					title: "Get Related Records",
					content: (
						<>
							<p className="mb-4">
								A library has one sample. <code className="px-1 py-0.5 bg-base-300 rounded">relationsFields</code> picks which sample fields come back.
							</p>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode
									code={`${base}/api/library?fields=id,lib_id&relations=sample&relationsFields=sample,samp_name&limit=1`}
								/>
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock
								language="json"
								url={`${base}/api/library?fields=id,lib_id&relations=sample&relationsFields=sample,samp_name&limit=1`}
							/>
						</>
					)
				},
				{
					id: "recipe-deep",
					title: "Reach Across Tables",
					content: (
						<>
							<p className="mb-4">
								An occurrence reaches a sample through its library. <code className="px-1 py-0.5 bg-base-300 rounded">limit=1</code> is one occurrence, so the
								library in the middle and the sample at the end are each a single record. The library comes back as an
								id.
							</p>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode
									code={`${base}/api/occurrence?fields=id&relations=sample&relationsFields=sample,samp_name&limit=1`}
								/>
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock
								language="json"
								url={`${base}/api/occurrence?fields=id&relations=sample&relationsFields=sample,samp_name&limit=1`}
							/>
						</>
					)
				},
				{
					id: "recipe-counts",
					title: "Count Without Downloading",
					content: (
						<>
							<p className="mb-4">
								Check how big a query is before you run it. The count endpoint takes the same filters as the table
								endpoint and returns a single number.
							</p>

							<div className="mb-4">
								Example URL: <InlineCode code={`${base}/api/occurrence/count?trusted=true`} />
							</div>

							<div className="mb-6">
								<ApiCodeBlock language="json" url={`${base}/api/occurrence/count?trusted=true`} />
							</div>

							<p className="mb-4">
								To count related records per row instead, use <code className="px-1 py-0.5 bg-base-300 rounded">relCounts</code> on the table endpoint.
							</p>

							<div className="mb-4">
								Example URL: <InlineCode code={`${base}/api/project?fields=project_id&relCounts=samples,analyses&limit=5`} />
							</div>

							<ApiCodeBlock
								language="json"
								url={`${base}/api/project?fields=project_id&relCounts=samples,analyses&limit=5`}
							/>
						</>
					)
				},
				{
					id: "recipe-pagination",
					title: "Page Through Large Tables",
					content: (
						<>
							<p className="mb-4">
								Large tables should be pulled in blocks. Set <code className="px-1 py-0.5 bg-base-300 rounded">limit</code> to the block size and increase{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">page</code> until a request comes back with fewer records than the limit.
							</p>

							<p className="mb-4">
								Always pair pagination with <code className="px-1 py-0.5 bg-base-300 rounded">orderBy</code>. Without a sort, the order is not guaranteed and a
								record can appear on two pages or be skipped.
							</p>

							<div className="mb-4">
								Example URL: <InlineCode code={`${base}/api/sample?fields=samp_name&orderBy=samp_name,asc&limit=5&page=3`} />
							</div>

							<div className="mb-6">
								<ApiCodeBlock
									language="json"
									url={`${base}/api/sample?fields=samp_name&orderBy=samp_name,asc&limit=5&page=3`}
								/>
							</div>

							<p className="mb-4">In Python, that loop looks like this:</p>
							<CodeBlock
								language="python"
								code={`import requests

url = "${base}/api/sample"
params = {"fields": "samp_name", "orderBy": "samp_name,asc", "limit": 500, "page": 1}
samples = []

while True:
	data = requests.get(url, params=params).json()
	if data["statusMessage"] != "success":
		raise Exception(data["error"])

	batch = data["result"]
	samples.extend(batch)

	if len(batch) < params["limit"]:
		break
	params["page"] += 1

print(len(samples))`}
							/>
						</>
					)
				},
				{
					id: "recipe-distinct",
					title: "Find Unique Combinations",
					content: (
						<>
							<p className="mb-4">
								Use <code className="px-1 py-0.5 bg-base-300 rounded">distinct</code> to collapse repeated values. One field gives you the list of values in use,
								which is handy for deciding what to filter on next.
							</p>

							<div className="mb-4">
								Example URL: <InlineCode code={`${base}/api/sample?distinct=geo_loc_name&fields=geo_loc_name&limit=5`} />
							</div>

							<div className="mb-6">
								<ApiCodeBlock
									language="json"
									url={`${base}/api/sample?distinct=geo_loc_name&fields=geo_loc_name&limit=5`}
								/>
							</div>

							<p className="mb-4">
								For a map of sampling locations, list latitude and longitude together. Asking for latitude on its own
								would keep one sample per latitude and flatten the survey into a line.
							</p>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode
									code={`${base}/api/sample?distinct=decimalLatitude,decimalLongitude&fields=decimalLatitude,decimalLongitude&limit=5`}
								/>
							</div>

							<ApiCodeBlock
								language="json"
								url={`${base}/api/sample?distinct=decimalLatitude,decimalLongitude&fields=decimalLatitude,decimalLongitude&limit=5`}
							/>
						</>
					)
				},
				{
					id: "recipe-submitters",
					title: "Look Up Who Submitted Data",
					content: (
						<>
							<p className="mb-4">
								Projects store the accounts that submitted them in <code className="px-1 py-0.5 bg-base-300 rounded">userIds</code>. Those are opaque IDs, so take
								them to the user endpoint to get names.
							</p>

							<div className="mb-4">
								Step 1, get the IDs: <InlineCode code={`${base}/api/project?fields=project_id,userIds&limit=5`} />
							</div>

							<div className="mb-6">
								<ApiCodeBlock language="json" url={`${base}/api/project?fields=project_id,userIds&limit=5`} />
							</div>

							<div className="mb-4">
								Step 2, resolve them: <InlineCode code={`${base}/api/user?userIds=`} /> followed by those ids, comma separated.
							</div>

							<p>
								Pass every ID in one request as a comma separated list. See{" "}
								<Link href="/docs/api/endpoints#get-users" className="link link-primary">
									Get Users
								</Link>{" "}
								for the response format.
							</p>
						</>
					)
				}
			]}
		/>
	);
}
