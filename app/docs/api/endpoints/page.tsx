import ApiCodeBlock from "@/app/components/docs/ApiCodeBlock";
import DocsPageSection from "@/app/components/docs/DocsPageSection";
import InlineCode from "@/app/components/docs/InlineCode";
import { prisma } from "@/app/helpers/prisma";
import TableMetadata, { TableNames } from "@/types/tableMetadata";

export default async function ApiEndpointsPage() {
	const taxonomy = await prisma.taxonomy.findFirst({
		orderBy: {
			id: "asc"
		},
		select: {
			id: true
		}
	});

	return (
		<DocsPageSection
			page="API"
			section="endpoints"
			header={
				<>
					<p className="mb-4">This section documents all available API endpoints and their functionality.</p>
				</>
			}
			subsections={[
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
							<div className="mb-4">Endpoint: /api/&lt;table&gt;/relations</div>

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
							<div className="mb-4">Endpoint: /api/&lt;table&gt;/fields</div>

							<div className="mb-4 mt-4">
								Example URL: <InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/assay/fields`} />
							</div>

							<p className="mb-4">Example Response:</p>
							<ApiCodeBlock language="json" url={`${process.env.NEXT_PUBLIC_URL}/api/assay/fields`} />
						</>
					)
				},
				{
					id: "get-unique-field-values",
					title: "Get Unique Field Values",
					content: (
						<>
							<div className="mb-4">Endpoint: /api/&lt;table&gt;/fields/&lt;fieldName&gt;</div>

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
							<div className="mb-4">Endpoint: /api/&lt;table&gt;</div>

							<p className="mb-4">
								Returns multiple records from a specific table. This endpoint supports various query parameters for
								filtering, selecting fields, including relations, and limiting results.
							</p>
							<p className="mb-2">
								For <InlineCode code="&lt;table&gt;" />, you can use either singular or plural table names.
							</p>
							<div className="mb-2">
								Singular table names: <InlineCode code={TableNames.map((table) => table.toLowerCase()).join(", ")} />
							</div>
							<div className="mb-4">
								Plural table names:{" "}
								<InlineCode code={TableNames.map((table) => TableMetadata[table].plural.toLowerCase()).join(", ")} />
							</div>
							<p className="mb-4">
								These are interchangeable in API paths (for example, <InlineCode code="/api/project" /> and{" "}
								<InlineCode code="/api/projects" /> both work). Use the same rule for related endpoints like{" "}
								<InlineCode code="/api/&lt;table&gt;/fields" /> and <InlineCode code="/api/&lt;table&gt;/relations" />.
							</p>
							<p className="mb-4">
								Table names are also case-insensitive in queries, so either spelling/casing is accepted.
							</p>

							<div className="mb-4">
								Example URL: <InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/project`} />
							</div>

							<p className="mb-4">Example Response:</p>
							<ApiCodeBlock
								language="json"
								url={`${process.env.NEXT_PUBLIC_URL}/api/project?limit=3`}
								defaultClosed={true}
							/>
						</>
					)
				},
				{
					id: "get-single-record",
					title: "Get Single Record",
					content: (
						<>
							<div className="mb-4">Endpoint: /api/&lt;table&gt;/&lt;id&gt;</div>

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
			]}
		/>
	);
}
