import ApiCodeBlock from "@/app/components/docs/ApiCodeBlock";
import Callout from "@/app/components/docs/Callout";
import DocsPageSection from "@/app/components/docs/DocsPageSection";
import InlineCode from "@/app/components/docs/InlineCode";
import OptionSummary from "@/app/components/docs/OptionSummary";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Query Options | API",
	description:
		"Reference for Ocean DNA Explorer API query options, including trusted data, field selection, relations, relation counts, sorting, distinct values, and pagination."
};

export default function ApiQueryParametersPage() {
	return (
		<DocsPageSection
			page="api"
			section="queryParameters"
			header={
				<div className="space-y-4">
					<p>
						These options control which data comes back and how it is shaped. To choose which records come back, see{" "}
						<Link href="/docs/api/searching" className="link link-primary">
							Filtering and Searching
						</Link>
						.
					</p>
					<p>
						Not every option works on every route. The{" "}
						<Link href="/docs/api/endpoints#options-by-endpoint" className="link link-primary">
							options by endpoint
						</Link>{" "}
						table shows what each one accepts.
					</p>
				</div>
			}
			subsections={[
				{
					id: "trusted-data",
					title: "Trusted Data",
					content: (
						<>
							<OptionSummary
								syntax="trusted=true"
								worksOn="Table, count, single record, and unique field values endpoints."
								rules="Any value other than true is treated as false."
							/>

							<p className="mb-4">
								Trusted data means analyses that have been reviewed for contamination and other causes of inaccurate
								identifications, plus the samples, taxonomies, and occurrences attached to them. Read more in{" "}
								<Link href="/docs/help/overview#trusted-vs-untrusted-data" className="link link-primary">
									Trusted vs Untrusted Data
								</Link>
								.
							</p>

							<Callout title="The API and the website have opposite defaults">
								<p>
									The website shows trusted data by default. The API returns everything by default, including analyses
									that have not been reviewed yet. Add{" "}
									<code className="px-1 py-0.5 bg-base-300 rounded">trusted=true</code> if you want your results to
									match what the website shows.
								</p>
							</Callout>

							<p className="mb-4">
								Compare the two counts below. The first includes every analysis, the second only reviewed ones.
							</p>

							<div className="mb-3">
								All analyses: <InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/analysis/count`} />
							</div>
							<div className="mb-6">
								<ApiCodeBlock language="json" url={`${process.env.NEXT_PUBLIC_URL}/api/analysis/count`} />
							</div>

							<div className="mb-3">
								Trusted analyses only:{" "}
								<InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/analysis/count?trusted=true`} />
							</div>
							<div className="mb-4">
								<ApiCodeBlock language="json" url={`${process.env.NEXT_PUBLIC_URL}/api/analysis/count?trusted=true`} />
							</div>

							<Callout title="In a browser, the trusted toggle wins">
								<p>
									The website stores your trusted toggle in a cookie, and your browser sends that cookie with any URL
									you paste into the address bar. If your toggle is off,{" "}
									<code className="px-1 py-0.5 bg-base-300 rounded">trusted=true</code> still returns untrusted data.
								</p>
								<p>
									Requests from code do not send that cookie, so the option always behaves as written. If you are
									testing in a browser, switch the trusted toggle on first.
								</p>
							</Callout>
						</>
					)
				},
				{
					id: "field-selection",
					title: "Field Selection",
					content: (
						<>
							<OptionSummary
								syntax="fields=❮field1❯,❮field2❯"
								worksOn="Table and single record endpoints."
								rules={
									<>
										Every name must exist on the table. Relation names are allowed. Anything listed in the{" "}
										<Link href="/docs/api/schema#table-definitions" className="link link-primary">
											table definitions
										</Link>{" "}
										can be requested.
									</>
								}
							/>

							<p className="mb-4">
								Returns only the fields you ask for. Without this option you get every field on the table, which is a
								lot of data for tables like Sample.
							</p>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode
									code={`${process.env.NEXT_PUBLIC_URL}/api/project?fields=id,project_name,institution&limit=5`}
								/>
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/project?fields=id,project_name,institution&limit=5`}
							/>
						</>
					)
				},
				{
					id: "relations",
					title: "Relations",
					content: (
						<>
							<OptionSummary
								syntax="relations=❮table1❯,❮table2❯"
								worksOn="Table and single record endpoints."
								rules="Any table the API can reach from the one you are querying, not just direct neighbors."
							/>

							<p className="mb-4">
								Relations pull data from connected tables in one request. Without them, getting a project and its
								samples takes two requests: one for the project, then one for the samples that reference it.
							</p>

							<p className="mb-4">
								Relations can be deep. If the table you name is several steps away, the API walks the path for you and
								includes every table along the way. By default each step returns only its{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">id</code>, which keeps the response small while still
								showing you the shape of the connection.
							</p>

							<p className="mb-4">
								<code className="px-1 py-0.5 bg-base-300 rounded">limit</code> caps records from the table in the URL.
								It does not cap the related rows nested inside them. One project can still come back with every sample
								it has.
							</p>

							<p className="mb-4">
								Analysis and Sample are joined through Library.{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">/api/analysis?relations=sample</code> returns each
								analysis, then each library as an id, then each sample as an id. That can be a lot of rows, because{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">limit</code> does not cap them.
							</p>

							<p className="mb-4">
								The loaded example is a library and its sample. A library has one sample, so{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">limit=1</code> is one library and one sample id.
							</p>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode
									code={`${process.env.NEXT_PUBLIC_URL}/api/library?fields=id,lib_id&relations=sample&limit=1`}
								/>
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/library?fields=id,lib_id&relations=sample&limit=1`}
							/>

							<p className="mt-4">
								To get real fields instead of bare IDs, add{" "}
								<Link href="#relation-field-options" className="link link-primary">
									relationsFields or relationsAllFields
								</Link>
								. To get counts instead of records, use{" "}
								<Link href="#relation-counts" className="link link-primary">
									relCounts
								</Link>
								.
							</p>
						</>
					)
				},
				{
					id: "relation-field-options",
					title: "Relation Fields",
					content: (
						<>
							<OptionSummary
								syntax={"relationsFields=❮table❯,❮field1❯,❮field2❯\nrelationsAllFields=true"}
								worksOn="Table and single record endpoints."
								rules={
									<>
										Both require <code className="px-1 py-0.5 bg-base-300 rounded">relations</code>, and they cannot be
										used together. Every table you name must also appear in{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">relations</code>.
									</>
								}
							/>

							<p className="mb-4">
								<code className="px-1 py-0.5 bg-base-300 rounded">relationsFields</code> picks specific fields from one
								related table. The first value is the table name and the rest are its fields. Repeat the whole option to
								cover more than one table.
							</p>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode
									code={`${process.env.NEXT_PUBLIC_URL}/api/library?fields=id&relations=sample&relationsFields=sample,samp_name,decimalLatitude&limit=1`}
								/>
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/library?fields=id&relations=sample&relationsFields=sample,samp_name,decimalLatitude&limit=1`}
							/>

							<p className="mt-6 mb-4">
								<code className="px-1 py-0.5 bg-base-300 rounded">relationsAllFields</code> is the shortcut for when you
								want everything. Set it to <code className="px-1 py-0.5 bg-base-300 rounded">true</code> for all fields
								on all requested relations, or give it a comma separated list of tables to limit it.
							</p>

							<p className="mb-4">
								This example asks a library for its assay. One library has one assay, and an assay row is short. The
								same option on Sample returns every field of that sample.
							</p>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode
									code={`${process.env.NEXT_PUBLIC_URL}/api/library?fields=id&relations=assay&relationsAllFields=assay&limit=1`}
								/>
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/library?fields=id&relations=assay&relationsAllFields=assay&limit=1`}
							/>

							<Callout title="Tables in the middle of a path stay as IDs">
								<p>
									A comma separated list expands only the tables you name. Steps in between that you did not name still
									return just an <code className="px-1 py-0.5 bg-base-300 rounded">id</code>.{" "}
									<code className="px-1 py-0.5 bg-base-300 rounded">relationsAllFields=true</code> expands every table
									on the path, including those steps.
								</p>
							</Callout>
						</>
					)
				},
				{
					id: "relation-counts",
					title: "Relation Counts",
					content: (
						<>
							<OptionSummary
								syntax="relCounts=❮table1❯,❮table2❯"
								worksOn="Table and single record endpoints."
								rules={
									<>
										Direct relations only. Use{" "}
										<code className="px-1 py-0.5 bg-base-300 rounded">/api/❮table❯/relations</code> to see which tables
										qualify.
									</>
								}
							/>

							<p className="mb-4">
								Adds a <code className="px-1 py-0.5 bg-base-300 rounded">_count</code> object to each record with the
								number of related records, without returning the records themselves. This is much cheaper than pulling
								the relations and counting them yourself.
							</p>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode
									code={`${process.env.NEXT_PUBLIC_URL}/api/project?relCounts=samples,analyses&fields=project_id&limit=5`}
								/>
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/project?relCounts=samples,analyses&fields=project_id&limit=5`}
							/>
						</>
					)
				},
				{
					id: "sorting-results",
					title: "Sorting Results",
					content: (
						<>
							<OptionSummary
								syntax="orderBy=❮field❯,asc"
								worksOn="Table endpoint only."
								rules="Two values separated by a comma. The second must be asc or desc."
							/>

							<p className="mb-4">
								The first value is either a field on the table or a to-many relation. Sorting by a relation sorts by how
								many related records each row has, so{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">orderBy=Samples,desc</code> puts the largest projects
								first.
							</p>

							<p className="mb-4">
								Relation names are the one place capitalization matters. Use the exact name returned by{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">/api/❮table❯/relations</code>, such as{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">Samples</code> rather than{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">samples</code>.
							</p>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode
									code={`${process.env.NEXT_PUBLIC_URL}/api/project?orderBy=Samples,desc&relCounts=samples&fields=project_id&limit=5`}
								/>
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/project?orderBy=Samples,desc&relCounts=samples&fields=project_id&limit=5`}
							/>
						</>
					)
				},
				{
					id: "distinct-values",
					title: "Distinct Values",
					content: (
						<>
							<OptionSummary
								syntax="distinct=❮field1❯,❮field2❯"
								worksOn="Table endpoint only."
								rules="Every name must be a field on the table."
							/>

							<p className="mb-4">
								Returns one record per unique combination of the listed fields. With a single field you get the first
								record for each distinct value of it. With several fields, the combination has to be unique.
							</p>

							<p className="mb-4">
								The difference matters for coordinates.{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">distinct=decimalLatitude</code> keeps one sample per
								latitude, which collapses a survey into a thin line. Adding longitude keeps each real location:
							</p>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode
									code={`${process.env.NEXT_PUBLIC_URL}/api/sample?distinct=decimalLatitude,decimalLongitude&fields=decimalLatitude,decimalLongitude&limit=5`}
								/>
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/sample?distinct=decimalLatitude,decimalLongitude&fields=decimalLatitude,decimalLongitude&limit=5`}
							/>
						</>
					)
				},
				{
					id: "result-limiting",
					title: "Limits and Pagination",
					content: (
						<>
							<OptionSummary
								syntax={"limit=❮number❯\npage=❮number❯"}
								worksOn="Table endpoint only."
								rules={
									<>
										Both must be positive integers. <code className="px-1 py-0.5 bg-base-300 rounded">page</code>{" "}
										requires <code className="px-1 py-0.5 bg-base-300 rounded">limit</code>.
									</>
								}
							/>

							<p className="mb-4">
								<code className="px-1 py-0.5 bg-base-300 rounded">limit</code> caps how many records come back.{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">page</code> then steps through them in blocks of that
								size, starting at <code className="px-1 py-0.5 bg-base-300 rounded">page=1</code>. With{" "}
								<code className="px-1 py-0.5 bg-base-300 rounded">limit=5</code>, page 2 returns records 6 through 10.
							</p>

							<p className="mb-4">
								Results usually come back in the order they were added to the database, but that is not guaranteed. If
								the order matters, and it does when paginating, set{" "}
								<Link href="#sorting-results" className="link link-primary">
									orderBy
								</Link>{" "}
								as well.
							</p>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode
									code={`${process.env.NEXT_PUBLIC_URL}/api/sample?fields=samp_name&orderBy=samp_name,asc&limit=5&page=2`}
								/>
							</div>

							<p className="mb-4">Example response:</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/sample?fields=samp_name&orderBy=samp_name,asc&limit=5&page=2`}
							/>
						</>
					)
				},
				{
					id: "ignore-extra-options",
					title: "Ignoring Extra Options",
					content: (
						<>
							<OptionSummary
								syntax="ignoreExtraOptions=true"
								worksOn="Table, count, and single record endpoints."
								rules="Does not hide errors caused by invalid field names."
							/>

							<p className="mb-4">
								By default, sending an option a route does not support returns an error. With this flag the unsupported
								options are skipped and the rest of the query runs.
							</p>

							<p className="mb-4">
								It exists so one query string can be sent to several routes that accept different options, which is how
								the website reuses a search across a table view and its record count. Most scripts are better off
								sending only the options a route supports, so mistakes stay visible.
							</p>

							<div className="mb-4">
								Example URL:{" "}
								<InlineCode
									code={`${process.env.NEXT_PUBLIC_URL}/api/project/count?limit=10&ignoreExtraOptions=true`}
								/>
							</div>

							<p className="mb-4">
								The count endpoint does not accept <code className="px-1 py-0.5 bg-base-300 rounded">limit</code>.
								Without the flag this returns an error, with it the count is returned as normal.
							</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/project/count?limit=10&ignoreExtraOptions=true`}
							/>
						</>
					)
				}
			]}
		/>
	);
}
