import ApiCodeBlock from "@/app/components/docs/ApiCodeBlock";
import Callout from "@/app/components/docs/Callout";
import DocsPageSection from "@/app/components/docs/DocsPageSection";
import InlineCode from "@/app/components/docs/InlineCode";
import { trustedPrisma } from "@/app/helpers/prisma";
import TableMetadata, { TableNames } from "@/types/tableMetadata";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
	title: "Endpoints | API",
	description:
		"Learn about Ocean DNA Explorer API endpoints for discovering tables, relations, fields, unique values, querying data, counting records, and retrieving individual records."
};

//which options each database endpoint accepts, taken from the parseApiQuery call in each route
const optionSupport = [
	{ option: "trusted", href: "/docs/api/queryParameters#trusted-data", table: true, id: true, count: true },
	{ option: "fields", href: "/docs/api/queryParameters#field-selection", table: true, id: true, count: false },
	{ option: "relations", href: "/docs/api/queryParameters#relations", table: true, id: true, count: false },
	{
		option: "relationsFields",
		href: "/docs/api/queryParameters#relation-field-options",
		table: true,
		id: true,
		count: false
	},
	{
		option: "relationsAllFields",
		href: "/docs/api/queryParameters#relation-field-options",
		table: true,
		id: true,
		count: false
	},
	{ option: "relCounts", href: "/docs/api/queryParameters#relation-counts", table: true, id: true, count: false },
	{ option: "orderBy", href: "/docs/api/queryParameters#sorting-results", table: true, id: false, count: false },
	{ option: "distinct", href: "/docs/api/queryParameters#distinct-values", table: true, id: false, count: false },
	{ option: "limit", href: "/docs/api/queryParameters#result-limiting", table: true, id: false, count: false },
	{ option: "page", href: "/docs/api/queryParameters#result-limiting", table: true, id: false, count: false },
	{ option: "ids", href: "/docs/api/searching#id-filtering", table: true, id: false, count: false },
	{ option: "search", href: "/docs/api/searching#standard-search", table: true, id: false, count: true },
	{ option: "advanced", href: "/docs/api/searching#advanced-search", table: true, id: false, count: true },
	{
		option: "❮field❯=❮value❯",
		href: "/docs/api/searching#direct-field-filtering",
		table: true,
		id: false,
		count: true
	},
	{ option: "polygon, circle", href: "/docs/api/searching#spatial-search", table: true, id: false, count: true },
	{ option: "blastQuery", href: "/docs/api/searching#blast-search", table: true, id: false, count: true },
	{
		option: "ignoreExtraOptions",
		href: "/docs/api/queryParameters#ignore-extra-options",
		table: true,
		id: true,
		count: true
	}
];

//white in the dark theme; base text color in light so the mark stays visible
function EndpointOptionMark({ supported }: { supported: boolean }) {
	return (
		<>
			<span
				aria-hidden="true"
				className={
					supported
						? "text-white [html[data-theme='light']_&]:text-base-content"
						: "font-semibold text-error [html[data-theme='dark']_&]:text-red-400"
				}
			>
				{supported ? "✓" : "✕"}
			</span>
			<span className="sr-only">{supported ? "Yes" : "No"}</span>
		</>
	);
}

//shared summary block so every endpoint is described the same way
function EndpointSummary({ path, returns, options }: { path: string; returns: ReactNode; options: ReactNode }) {
	return (
		<div className="mb-5 w-fit max-w-3xl rounded-md bg-base-200/60 px-4 py-3 space-y-1">
			<div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-lg">
				<span className="font-mono font-semibold">GET</span>
				<span className="font-mono font-normal break-all">{path}</span>
			</div>
			<div>
				<span className="font-semibold">Returns:</span> {returns}
			</div>
			<div>
				<span className="font-semibold">Options:</span> {options}
			</div>
		</div>
	);
}

export default async function ApiEndpointsPage() {
	const [taxonomy, submitter] = await trustedPrisma.$transaction([
		trustedPrisma.taxonomy.findFirst({
			orderBy: {
				id: "asc"
			},
			select: {
				id: true
			}
		}),
		trustedPrisma.project.findFirst({
			where: {
				NOT: { userIds: { isEmpty: true } }
			},
			orderBy: {
				id: "asc"
			},
			select: {
				userIds: true
			}
		})
	]);

	const userIdsParam = submitter?.userIds.slice(0, 2).join(",");

	return (
		<DocsPageSection
			page="api"
			section="endpoints"
			header={
				<>
					<p className="mb-4">
						Every endpoint is a GET request and returns JSON. Replace{" "}
						<code className="px-1 py-0.5 bg-base-300 rounded">❮table❯</code> with any table name from the{" "}
						<Link href="/docs/api/schema" className="link link-primary">
							Database Schema
						</Link>
						.
					</p>
					<p className="mb-4">
						Three endpoints query the database: the table endpoint, the count endpoint, and the single record endpoint.
						The rest describe the database itself and are useful for finding out what you can ask for.
					</p>
					<p className="mb-4">
						Live examples below show only <code className="px-1 py-0.5 bg-base-300 rounded">result</code>. The{" "}
						<Link href="/docs/api/responses" className="link link-primary">
							Response Format
						</Link>{" "}
						page shows the full JSON around it.
					</p>
				</>
			}
			subsections={[
				{
					id: "table-names",
					title: "Table Names in URLs",
					content: (
						<>
							<p className="mb-4">
								Table names are case-insensitive, and singular or plural both work. So{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">/api/project</code>,{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">/api/projects</code>, and{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">/api/Projects</code> are the same request. The same
								rule applies to table names used inside options such as{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">relations</code>.
							</p>

							<div className="mb-3">
								Singular names: <InlineCode code={TableNames.map((table) => table.toLowerCase()).join(", ")} />
							</div>
							<div className="mb-4">
								Plural names:{" "}
								<InlineCode code={TableNames.map((table) => TableMetadata[table].plural.toLowerCase()).join(", ")} />
							</div>
						</>
					)
				},
				{
					id: "get-all-tables",
					title: "Get All Tables",
					content: (
						<>
							<EndpointSummary path="/api/tables" returns="An array of table name strings." options="None." />

							<p className="mb-4">Use this to discover which tables you can query.</p>

							<div className="mb-4">
								Example URL: <InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/tables`} />
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock language="json" url={`${process.env.NEXT_PUBLIC_URL}/api/tables`} />
						</>
					)
				},
				{
					id: "get-table-fields",
					title: "Get Table Fields",
					content: (
						<>
							<EndpointSummary
								path="/api/❮table❯/fields"
								returns={
									<>
										An object keyed by field name. Each value has a{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">type</code>, an{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">optional</code> flag, and a{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">values</code> array when the field is an enum.
									</>
								}
								options="None."
							/>

							<p className="mb-4">
								This is the fastest way to check the exact spelling of a field before using it in{" "}
								<Link href="/docs/api/queryParameters#field-selection" className="link link-primary">
									fields
								</Link>{" "}
								or a filter.
							</p>

							<div className="mb-4">
								Example URL: <InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/assay/fields`} />
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock language="json" url={`${process.env.NEXT_PUBLIC_URL}/api/assay/fields`} />
						</>
					)
				},
				{
					id: "get-table-relations",
					title: "Get Table Relations",
					content: (
						<>
							<EndpointSummary
								path="/api/❮table❯/relations"
								returns={
									<>
										An array of objects with <code className="px-1 py-0.5 bg-base-300 rounded">field</code> (the name to
										use in queries), <code className="px-1 py-0.5 bg-base-300 rounded">table</code> (the table it points
										at), and <code className="px-1 py-0.5 bg-base-300 rounded">type</code> (such as one-to-many).
									</>
								}
								options="None."
							/>

							<p className="mb-4">
								Only direct relations are listed. You can still reach tables further away with the{" "}
								<Link href="/docs/api/queryParameters#relations" className="link link-primary">
									relations
								</Link>{" "}
								option, which walks the path for you.
							</p>

							<div className="mb-4">
								Example URL: <InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/project/relations`} />
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock language="json" url={`${process.env.NEXT_PUBLIC_URL}/api/project/relations`} />
						</>
					)
				},
				{
					id: "get-unique-field-values",
					title: "Get Unique Field Values",
					content: (
						<>
							<EndpointSummary
								path="/api/❮table❯/fields/❮field❯"
								returns="A flat array of every distinct value for that field."
								options={
									<>
										<code className="px-1 py-0.5 bg-base-300 rounded">trusted</code> only.
									</>
								}
							/>

							<p className="mb-4">
								Useful for finding out what you can filter on when a field repeats across many records, such as
								locations or instruments.
							</p>

							<div className="mb-4">
								Example URL: <InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/taxonomy/fields/kingdom`} />
							</div>

							<p className="mb-4">Returns every distinct value for that field. There is no limit option.</p>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock language="json" url={`${process.env.NEXT_PUBLIC_URL}/api/taxonomy/fields/kingdom`} />
						</>
					)
				},
				{
					id: "query-table-data",
					title: "Query Table Data",
					content: (
						<>
							<EndpointSummary
								path="/api/❮table❯"
								returns="An array of records. An empty array means nothing matched."
								options={
									<>
										Every option in the API. See{" "}
										<Link href="/docs/api/searching" className="link link-primary">
											Filtering and Searching
										</Link>{" "}
										and{" "}
										<Link href="/docs/api/queryParameters" className="link link-primary">
											Query Options
										</Link>
										.
									</>
								}
							/>

							<p className="mb-4">
								This is the main endpoint and the one most queries use. Without options it returns every record in the
								table, so add <code className="px-1 py-0.5 bg-base-300 rounded">limit</code> while you are
								experimenting.
							</p>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode
									code={`${process.env.NEXT_PUBLIC_URL}/api/project?fields=id,project_id,project_name&limit=5`}
								/>
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/project?fields=id,project_id,project_name&limit=5`}
							/>
						</>
					)
				},
				{
					id: "count-records",
					title: "Count Records",
					content: (
						<>
							<EndpointSummary
								path="/api/❮table❯/count"
								returns={
									<>
										A single number in <code className="px-1 py-0.5 bg-base-300 rounded">result</code> instead of an
										array.
									</>
								}
								options={
									<>
										<code className="px-1 py-0.5 bg-base-300 rounded">trusted</code>, field filters,{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">search</code>,{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">advanced</code>,{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">polygon</code>,{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">circle</code>, and the BLAST options.
									</>
								}
							/>

							<p className="mb-4">
								Use this to size a query before downloading it. It accepts the same filters as the table endpoint, so
								you can take a working query, swap the URL, and get a count of the matches.
							</p>

							<p className="mb-4">
								Options that shape records rather than select them are rejected here, including{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">fields</code>,{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">relations</code>,{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">ids</code>,{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">orderBy</code>, and{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">limit</code>.
							</p>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/sample/count?geo_loc_name=Atlantic`} />
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/sample/count?geo_loc_name=Atlantic`}
							/>
						</>
					)
				},
				{
					id: "get-single-record",
					title: "Get Single Record",
					content: (
						<>
							<EndpointSummary
								path="/api/❮table❯/❮id❯"
								returns="A single object, or an error if no record has that ID."
								options={
									<>
										<code className="px-1 py-0.5 bg-base-300 rounded">trusted</code>,{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">fields</code>,{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">relations</code>,{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">relationsFields</code>,{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">relationsAllFields</code>, and{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">relCounts</code>.
									</>
								}
							/>

							<Callout title="This is the database ID, not project_id or samp_name">
								<p>
									<code className="px-1 py-0.5 bg-base-300 rounded">❮id❯</code> is the integer primary key from the{" "}
									<code className="px-1 py-0.5 bg-base-300 rounded">id</code> field. It is not{" "}
									<code className="px-1 py-0.5 bg-base-300 rounded">project_id</code>,{" "}
									<code className="px-1 py-0.5 bg-base-300 rounded">samp_name</code>, or any other name you see in the
									data.
								</p>
								<p>
									To look a record up by a name you already know, filter on the table endpoint instead, for example{" "}
									<code className="px-1 py-0.5 bg-base-300 rounded">/api/project?project_id=gomecc4</code>.
								</p>
							</Callout>

							<p className="mb-4">
								Filtering, searching, sorting, and limiting are all rejected on this route, because the record is
								already chosen by the URL.
							</p>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode
									code={`${process.env.NEXT_PUBLIC_URL}/api/taxonomy/${taxonomy?.id || 1}?fields=id,taxonomy`}
								/>
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/taxonomy/${taxonomy?.id || 1}?fields=id,taxonomy`}
							/>
						</>
					)
				},
				{
					id: "get-dead-values",
					title: "Get Dead Values",
					content: (
						<>
							<EndpointSummary
								path="/api/deadValues"
								returns="An object mapping each placeholder label to its numeric code, and each code back to its label."
								options="None."
							/>

							<p className="mb-4">
								Submitters cannot always provide a real measurement. When a number or date is missing, ODE stores a
								reserved code instead of leaving the field empty, so the reason stays attached to the record. Labels
								include values such as not collected, not applicable, and restricted access.
							</p>

							<p className="mb-4">
								If a numeric field comes back as a large negative number near -9999, look it up here before treating it
								as real data.
							</p>

							<div className="mb-4">
								Example URL: <InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/deadValues`} />
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock language="json" url={`${process.env.NEXT_PUBLIC_URL}/api/deadValues`} />
						</>
					)
				},
				{
					id: "get-users",
					title: "Get Users",
					content: (
						<>
							<EndpointSummary
								path="/api/user"
								returns={
									<>
										An array of user objects with <code className="px-1 py-0.5 bg-base-300 rounded">id</code>,{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">firstName</code>,{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">lastName</code>,{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">publicMetadata</code>,{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">banned</code>, and{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">imageUrl</code>.
									</>
								}
								options={
									<>
										<code className="px-1 py-0.5 bg-base-300 rounded">userIds</code> (comma separated) or{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">query</code> (name search).
									</>
								}
							/>

							<p className="mb-4">
								Every project carries a <code className="px-1 py-0.5 bg-base-300 rounded">userIds</code> field listing
								the accounts that submitted it. Those are opaque IDs, so pass them here to find out who the people are.
							</p>

							{userIdsParam ? (
								<>
									<div className="mb-4">
										Example URL: <InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/user?userIds=${userIdsParam}`} />
									</div>

									<p className="mb-4">Example response:</p>
									<ApiCodeBlock
										language="json"
										url={`${process.env.NEXT_PUBLIC_URL}/api/user?userIds=${userIdsParam}`}
									/>
								</>
							) : null}

							<p className="mt-4">Email addresses are never included in this response for unauthenticated requests.</p>
						</>
					)
				},
				{
					id: "options-by-endpoint",
					title: "Options by Endpoint",
					content: (
						<>
							<p className="mb-4">
								Each endpoint accepts its own set of options. An option that works on one route is not guaranteed to
								work on another. Select an option name to read how it works.
							</p>

							<div className="overflow-x-auto">
								<table className="table table-md table-zebra">
									<thead>
										<tr>
											<th>Option</th>
											<th>/api/❮table❯</th>
											<th>/api/❮table❯/count</th>
											<th>/api/❮table❯/❮id❯</th>
										</tr>
									</thead>
									<tbody>
										{optionSupport.map((row) => (
											<tr key={row.option}>
												<td>
													<Link href={row.href} className="link link-primary font-mono text-sm">
														{row.option}
													</Link>
												</td>
												<td>
													<EndpointOptionMark supported={row.table} />
												</td>
												<td>
													<EndpointOptionMark supported={row.count} />
												</td>
												<td>
													<EndpointOptionMark supported={row.id} />
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<p className="mt-6 mb-4">
								The remaining endpoints take no options at all, with one exception:{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">/api/❮table❯/fields/❮field❯</code> accepts{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">trusted</code>.
							</p>

							<Callout title="Unsupported options are errors, not warnings">
								<p>
									Sending an option a route does not support fails the whole request. So does sending a name that is
									neither an option nor a field on the table, because unrecognized names are read as field filters.
								</p>
								<p>
									If you would rather have unsupported options ignored, add{" "}
									<Link href="/docs/api/queryParameters#ignore-extra-options" className="link link-primary">
										ignoreExtraOptions=true
									</Link>
									.
								</p>
							</Callout>
						</>
					)
				}
			]}
		/>
	);
}
