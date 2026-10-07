import ApiCodeBlock from "@/app/components/docs/ApiCodeBlock";
import ApiQueryDiagram from "@/app/components/docs/ApiQueryDiagram";
import Callout from "@/app/components/docs/Callout";
import CodeBlock from "@/app/components/docs/CodeBlock";
import DocsPageSection from "@/app/components/docs/DocsPageSection";
import InlineCode from "@/app/components/docs/InlineCode";
import OptionSummary from "@/app/components/docs/OptionSummary";
import { trustedPrisma } from "@/app/helpers/prisma";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Filtering and Searching | API",
	description:
		"Learn how to choose which Ocean DNA Explorer records come back using field filters, text search, ID lists, advanced queries, map shapes, and BLAST sequences."
};

const queryModes = [
	{ mode: "contains", description: "Case-insensitive match anywhere in the text.", appliesTo: "Text" },
	{ mode: "equals", description: "Exact match.", appliesTo: "Text, Numeric, Date" },
	{ mode: "startsWith", description: "Case-insensitive match at the beginning of the text.", appliesTo: "Text" },
	{ mode: "endsWith", description: "Case-insensitive match at the end of the text.", appliesTo: "Text" },
	{ mode: "gt", description: "Greater than.", appliesTo: "Numeric, Date" },
	{ mode: "gte", description: "Greater than or equal to.", appliesTo: "Numeric, Date" },
	{ mode: "lt", description: "Less than.", appliesTo: "Numeric, Date" },
	{ mode: "lte", description: "Less than or equal to.", appliesTo: "Numeric, Date" },
	{ mode: "range", description: "Value is within the specified range, inclusive.", appliesTo: "Numeric, Date" },
	{ mode: "in", description: "Value matches any entry in a list.", appliesTo: "Text, Numeric, Date" },
	{ mode: "notIn", description: "Value matches no entry in a list.", appliesTo: "Text, Numeric, Date" },
	{ mode: "null", description: "Field is empty. Takes no value, and only works on optional fields.", appliesTo: "Any" },
	{
		mode: "notNull",
		description: "Field has a value. Takes no value, and only works on optional fields.",
		appliesTo: "Any"
	},
	{
		mode: "deadValue",
		description: "Matches a placeholder such as not collected. Use any to match all placeholders.",
		appliesTo: "Text, Numeric, Date"
	},
	{ mode: "boolean", description: "Exact match on a true or false field.", appliesTo: "Boolean" }
];

const blastOptions = [
	{ option: "blastDatabase", description: "Name of the assay whose reference database should be searched." },
	{ option: "task", description: "BLAST task to run. Defaults to blastn." },
	{ option: "max_target_seqs", description: "Maximum number of matches to return. Must be an integer." },
	{ option: "evalue", description: "Expect value cutoff. Must be a number." },
	{ option: "perc_identity", description: "Minimum percent identity. Must be a number." },
	{ option: "qcov_hsp_perc", description: "Minimum query coverage per match, as a percent. Must be a number." },
	{ option: "blastSave", description: "Saves the query results. Requires a signed in contributor account." }
];

export default async function ApiSearchPage() {
	const project = await trustedPrisma.project.findFirst({
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
						These options choose which records come back. Once you have the right records, the{" "}
						<Link href="/docs/api/queryParameters" className="link link-primary">
							Query Options
						</Link>{" "}
						control what each one looks like.
					</p>

					<Callout title="Pick one way to filter">
						<p>
							Field filters, <code className="px-1 py-0.5 bg-base-300 rounded">search</code>,{" "}
							<code className="px-1 py-0.5 bg-base-300 rounded">ids</code>, and{" "}
							<code className="px-1 py-0.5 bg-base-300 rounded">advanced</code> are mutually exclusive. Using more than
							one of them in the same request returns an error.
						</p>
						<p>
							Spatial and BLAST options are not part of that group. You can add them to any of the four, and to each
							other.
						</p>
					</Callout>
				</>
			}
			subsections={[
				{
					id: "direct-field-filtering",
					title: "Direct Field Filtering",
					content: (
						<>
							<OptionSummary
								syntax="❮field❯=❮value❯"
								worksOn="Table and count endpoints."
								rules="The name must be a field on the table. Several fields at once are combined with AND."
							/>

							<p className="mb-4">
								The simplest way to filter. Text fields use a case-insensitive contains match, so{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">project_name=gomecc</code> also matches GOMECC4.
								Number fields match exactly.
							</p>

							<p className="mb-4">
								For ranges, dates, OR logic, or filtering on a related table, use{" "}
								<Link href="#advanced-search" className="link link-primary">
									advanced search
								</Link>{" "}
								instead.
							</p>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode
									code={`${process.env.NEXT_PUBLIC_URL}/api/project?project_name=gomecc&institution=noaa&fields=id,project_id,project_name&limit=5`}
								/>
							</div>

							<p className="mb-4">
								This returns projects where <code className="px-1 py-0.5 bg-base-300 rounded">project_name</code>{" "}
								contains gomecc and <code className="px-1 py-0.5 bg-base-300 rounded">institution</code> contains noaa.
							</p>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/project?project_name=gomecc&institution=noaa&fields=id,project_id,project_name&limit=5`}
							/>

							<Callout title="Unrecognized names are treated as fields">
								<p>
									Anything in the query string that is not a known option is read as a field filter. A typo in an option
									name therefore fails the request, because no field by that name exists on the table.
								</p>
							</Callout>
						</>
					)
				},
				{
					id: "standard-search",
					title: "Standard Search",
					content: (
						<>
							<OptionSummary
								syntax="search=❮text❯"
								worksOn="Table and count endpoints."
								rules="Searches text fields only. Numbers, dates, and booleans are skipped."
							/>

							<p className="mb-4">
								Looks for your text in every text field on the table and returns a record if any of them match. The
								match is case-insensitive and does not need to be the whole value.
							</p>

							<p className="mb-4">
								Use this when you know the term but not which field holds it. If you do know the field, a direct field
								filter is faster and more precise.
							</p>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode
									code={`${process.env.NEXT_PUBLIC_URL}/api/project?search=gomecc&fields=id,project_id,project_name&limit=5`}
								/>
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/project?search=gomecc&fields=id,project_id,project_name&limit=5`}
							/>
						</>
					)
				},
				{
					id: "id-filtering",
					title: "ID Filtering",
					content: (
						<>
							<OptionSummary
								syntax="ids=❮id1❯,❮id2❯"
								worksOn="Table endpoint only."
								rules="Integers only. These are database IDs, not project_id or samp_name."
							/>

							<p className="mb-4">
								Fetches a known set of records in one request. IDs that do not exist are skipped rather than causing an
								error, so a short response can simply mean some of the IDs were wrong.
							</p>

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

							<p className="mb-2 mt-8">Example response:</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/project?ids=${project?.id || 1}&fields=id,project_id,project_name`}
							/>
						</>
					)
				},
				{
					id: "advanced-search",
					title: "Advanced Search",
					content: (
						<>
							<OptionSummary
								syntax="advanced=❮JSON array❯"
								worksOn="Table and count endpoints."
								rules="Conditions at the top level are combined with AND. A nested array becomes an OR group."
							/>

							<p className="mb-4">
								The most capable filter. It supports comparisons, ranges, OR logic, and conditions on related tables.
							</p>

							<Callout title="Build it with the UI">
								<p>
									Use the{" "}
									<Link href="/search" className="link link-primary font-semibold">
										Search
									</Link>{" "}
									page to build a query by clicking, then copy the URL out of the address bar. No JSON by hand.
								</p>
							</Callout>

							<h4>JSON structure</h4>
							<p className="mb-4">
								Each condition is an array. Three values filter the current table, four values filter a related table.
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

							<h4>Query modes</h4>
							<p className="mb-4">The query mode decides how the value is compared.</p>
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
										{queryModes.map((row) => (
											<tr key={row.mode}>
												<td className="font-mono text-primary">{row.mode}</td>
												<td>{row.description}</td>
												<td>{row.appliesTo}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<p className="mt-4 mb-4">
								<code className="px-1 py-0.5 bg-base-300 rounded">range</code>,{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">in</code>, and{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">notIn</code> take an array as their value, for example{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">
									[&quot;minimumDepthInMeters&quot;, &quot;range&quot;, [0, 50]]
								</code>
								. <code className="px-1 py-0.5 bg-base-300 rounded">null</code> and{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">notNull</code> take no value at all, so the condition
								is only two items long.
							</p>

							<ApiQueryDiagram
								baseUrl={`${process.env.NEXT_PUBLIC_URL}`}
								endpoint={{ value: `/api/sample`, label: "Endpoint", colorClass: "text-primary" }}
								parameters={[
									{
										value: `advanced=[["geo_loc_name","contains","Atlantic"],["eventDate","gte","2019-01-01"]]`,
										label: "Advanced Query",
										colorClass: "text-primary"
									}
								]}
								description={
									<>
										This query returns samples where the <strong>geo_loc_name</strong> contains Atlantic AND the{" "}
										<strong>eventDate</strong> is on or after January 1st, 2019.
									</>
								}
							/>
						</>
					)
				},
				{
					id: "spatial-search",
					title: "Spatial Search",
					content: (
						<>
							<OptionSummary
								syntax={"polygon=❮lat❯/❮lng❯,❮lat❯/❮lng❯,❮lat❯/❮lng❯\ncircle=❮lat❯/❮lng❯,❮radius❯"}
								worksOn="Table and count endpoints."
								rules="A polygon needs at least three points. A circle radius is in meters. Both options can be repeated."
							/>

							<p className="mb-4">
								Limits results to records collected inside the shapes you provide. Providing several shapes matches
								anything inside any of them.
							</p>

							<p className="mb-4">
								This works on any table, not just Sample. For tables without coordinates of their own, the API finds the
								samples inside the shapes and filters through the relations to them.
							</p>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode
									code={`${process.env.NEXT_PUBLIC_URL}/api/project?circle=27.0/-83.0,200000&fields=project_id&limit=5`}
								/>
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/project?circle=27.0/-83.0,200000&fields=project_id&limit=5`}
							/>

							<Callout title="limit is ignored on tables that have their own coordinates">
								<p>
									Sample carries latitude and longitude directly, so the API filters those results in memory after the
									database query. <code className="px-1 py-0.5 bg-base-300 rounded">limit</code> is skipped in that
									case. On tables reached through Sample, such as Project, the filter happens in the database and{" "}
									<code className="px-1 py-0.5 bg-base-300 rounded">limit</code> works normally.
								</p>
							</Callout>

							<p className="mt-4">
								Writing coordinates by hand is tedious. Drawing the shape on the map on the{" "}
								<Link href="/search" className="link link-primary">
									Search
								</Link>{" "}
								page and copying the URL is usually easier.
							</p>
						</>
					)
				},
				{
					id: "blast-search",
					title: "BLAST Search",
					content: (
						<>
							<OptionSummary
								syntax={"blastQuery=❮sequence❯\nblastQuery=❮name❯,❮sequence❯"}
								worksOn="Table and count endpoints."
								rules="Every other BLAST option requires blastQuery. Repeat blastQuery for more sequences, in which case every sequence needs a name."
							/>

							<p className="mb-4">
								Matches your DNA sequence against the features in the database and limits results to the records that
								contain those features. Because the filter is applied through relations, it works on any table.
							</p>

							<div className="overflow-x-auto mb-4">
								<table className="table table-md table-zebra">
									<thead>
										<tr>
											<th>Option</th>
											<th>Description</th>
										</tr>
									</thead>
									<tbody>
										{blastOptions.map((row) => (
											<tr key={row.option}>
												<td className="font-mono text-primary">{row.option}</td>
												<td>{row.description}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode
									code={`${process.env.NEXT_PUBLIC_URL}/api/feature?blastQuery=GACGAACTTTAGCCTGCTAA&perc_identity=97&limit=5`}
								/>
							</div>

							<p className="mb-4">
								A BLAST response carries two extra top level keys next to{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">result</code>:{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">BlastQueryResults</code> with one object per match,
								and <code className="px-1 py-0.5 bg-base-300 rounded">existingBlastDate</code> with the date if that
								same query was run before.
							</p>

							<p className="mb-4">
								This example is not a live response. The fields match{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">BlastQueryResult</code>.
							</p>

							<CodeBlock
								language="json"
								code={`{
	"statusMessage": "success",
	"result": [],
	"BlastQueryResults": [
		{
			"id": 1,
			"query": "example",
			"sequence": "GACGAACTTTAGCCTGCTAA",
			"featureid": "feature-id",
			"queryId": 1,
			"percentIdentity": 100,
			"alignmentLength": 20,
			"mismatches": 0,
			"gapOpens": 0,
			"queryStart": 1,
			"queryEnd": 20,
			"subjectStart": 1,
			"subjectEnd": 20,
			"eValue": 0.001,
			"bitScore": 40
		}
	],
	"existingBlastDate": null
}`}
							/>
						</>
					)
				}
			]}
		/>
	);
}
