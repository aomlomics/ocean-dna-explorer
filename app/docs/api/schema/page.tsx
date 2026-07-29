import CodeBlock from "@/app/components/docs/CodeBlock";
import DocsPageSection from "@/app/components/docs/DocsPageSection";
import SchemaDisplay from "@/app/components/SchemaDisplay";
import Link from "next/link";
import Image from "next/image";

export default function ApiSchemaPage() {
	return (
		<DocsPageSection
			page="API"
			section="schema"
			header={
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
			}
			subsections={[
				{
					id: "entity-relationship-diagram",
					title: "Entity Relationship Diagram",
					content: (
						<>
							<p className="mb-4">The following diagram shows the relationships between tables in the database:</p>

							<div className="p-4 rounded-md mb-4 bg-base-200">
								<div className="relative w-full h-200">
									<Image fill src="/images/ERD.svg" alt="Database entity relationship diagram" />
									<Image
										src="/images/ERD-Notation.PNG"
										alt="ERD notation key"
										width="279"
										height="137"
										className="w-1/4 h-auto absolute right-0 top-0 px-6 py-6"
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
								The dropdown menus below show the fields available for each table. You can use this information in your
								API requests to query and filter on specific fields.
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
									page, a record of the changes is stored in the `editHistory` field. This field contains a JSON array
									of objects, where each object represents a set of edits made at a specific time.
								</p>
								<p className="mb-4">
									Note: While the example shows an `id` for each edit, this is for illustrative purposes. The current
									implementation does not yet include a unique ID for each edit record.
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
			]}
		/>
	);
}
