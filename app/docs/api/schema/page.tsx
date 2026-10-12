import CodeBlock from "@/app/components/docs/CodeBlock";
import DocsPageSection from "@/app/components/docs/DocsPageSection";
import OdeErdDiagram from "@/app/components/docs/OdeErdDiagram";
import SchemaDisplay from "@/app/components/docs/SchemaDisplay";
import Link from "next/link";
import type { Metadata } from "next";

const keyMarkProps = {
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeMiterlimit: 10
} as const;

function ErdKeyMandatory() {
	return (
		<svg viewBox="0 0 25.19 50.24" className="h-12 w-6 shrink-0" aria-hidden="true">
			<g {...keyMarkProps}>
				<line x1="0" y1="23.62" x2="25.19" y2="23.62" />
				<line x1="0" y1="34.17" x2="25.19" y2="34.17" />
				<line x1="12.59" y1="0" x2="12.59" y2="23.62" />
				<line x1="12.59" y1="34.9" x2="12.59" y2="50.24" />
			</g>
		</svg>
	);
}

function ErdKeyMany() {
	return (
		<svg viewBox="0 0 25.19 50.64" className="h-12 w-6 shrink-0" aria-hidden="true">
			<g {...keyMarkProps}>
				<line x1="12.48" y1="28.11" x2="12.48" y2="0" />
				<line x1="25.19" y1="27.33" x2="0" y2="27.33" />
				<line x1="12.48" y1="50.24" x2="12.48" y2="28.52" />
				<line x1="22.67" y1="50.23" x2="12.75" y2="28.11" />
				<line x1="2.53" y1="50.24" x2="12.25" y2="28.11" />
			</g>
		</svg>
	);
}

function ErdKeyOptional() {
	return (
		<svg viewBox="0 0 19.61 51" className="h-12 w-6 shrink-0" aria-hidden="true">
			<g {...keyMarkProps}>
				<line x1="9.71" y1="50.19" x2="9.71" y2="31.41" />
				<circle cx="9.71" cy="24.35" r="7.19" />
				<line x1="18.69" y1="50.59" x2="10.07" y2="31.39" />
				<line x1=".92" y1="50.59" x2="9.5" y2="31.04" />
				<line x1="9.92" y1="17.29" x2="9.92" y2="0" />
			</g>
		</svg>
	);
}

export const metadata: Metadata = {
	title: "Database Schema | API",
	description:
		"Understand the Ocean DNA Explorer database schema, including table relationships and field definitions, to build effective API queries."
};

export default function ApiSchemaPage() {
	return (
		<DocsPageSection
			page="api"
			section="schema"
			header={
				<>
					<p className="mb-4">
						A simplified diagram of how the tables connect. Field names for each table are in Table Definitions below.
						Use it to{" "}
						<Link href="/docs/api/queryParameters#relations" className="text-primary">
							query relations across tables
						</Link>{" "}
						and{" "}
						<Link href="/docs/api/searching#direct-field-filtering" className="text-primary">
							filter by fields
						</Link>
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
							<div className="mt-8 mb-2 -mx-4 text-primary md:-mx-6 lg:-mx-8">
								<OdeErdDiagram />
							</div>

							<div className="not-prose mb-8 flex flex-col gap-4 text-sm leading-relaxed text-base-content">
								<div className="flex items-center gap-4">
									<span className="text-primary">
										<ErdKeyMandatory />
									</span>
									<p>
										<span className="font-medium">Exactly one.</span> The record on this end is required.
									</p>
								</div>
								<div className="flex items-center gap-4">
									<span className="text-primary">
										<ErdKeyMany />
									</span>
									<p>
										<span className="font-medium">One or many.</span> At least one related record.
									</p>
								</div>
								<div className="flex items-center gap-4">
									<span className="text-primary">
										<ErdKeyOptional />
									</span>
									<p>
										<span className="font-medium">Zero or many.</span> Related records can be missing.
									</p>
								</div>
							</div>

							<p className="mb-4">
								Use this diagram as a reference when constructing queries with the{" "}
								<Link href="/docs/api/queryParameters#relations" className="text-primary">
									relations
								</Link>{" "}
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
							</div>
							<h4 className="font-medium mb-2">Structure of an Edit Record:</h4>
							<CodeBlock
								language="json"
								code={`{
	"id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
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
