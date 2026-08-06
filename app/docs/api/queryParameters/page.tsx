import DocsPageSection from "@/app/components/docs/DocsPageSection";
import InlineCode from "@/app/components/docs/InlineCode";
import Link from "next/link";

export default function ApiQueryParametersPage() {
	return (
		<DocsPageSection
			page="api"
			section="queryParameters"
			header={
				<div className="space-y-4">
					<p>
						Query parameters allow you to customize your API requests. This section details all available parameters and
						how to use them.
					</p>
				</div>
			}
			subsections={[
				{
					id: "field-selection",
					title: "Field Selection",
					content: (
						<>
							<div className="mb-4">Parameter: fields=❮field1❯,❮field2❯,❮field3❯</div>

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
							<div className="mb-4">Parameter: ❮fieldName❯=❮value❯</div>

							<p className="mb-4">
								Filters results to return only records where the specified field contains the provided value. For more
								details, see the{" "}
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
							<p>Parameter: relations=❮relation1❯,❮relation2❯</p>
							<p>
								Includes related data from other tables in the response. Relation names can be lowercase or capitalized.
							</p>

							<div className="my-6 px-4 py-3 bg-base-200/50 border-l-4 border-accent rounded-md shadow-sm">
								<h5 className="font-semibold mb-2 text-accent">Why Use Relations?</h5>
								<p className="text-sm">
									Relations are powerful because they let you fetch data from multiple connected tables in a single API
									call. For instance, without relations, to get a project and all its samples, you would have to:
								</p>
								<ol className="list-decimal list-inside text-sm mt-2 space-y-1">
									<li>Make a first request to get the project data.</li>
									<li>
										Make a second request to the sample table, filtering by the project's ID to get the related samples.
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
							<p>Parameter: relationsAllFields=true</p>

							<p>Controls whether to include all fields on related records (true) or just their ID (false, default).</p>

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
							<p>Parameter: limit=❮number❯</p>
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
							<p>Parameter: relationsLimit=❮number❯</p>
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
			]}
		/>
	);
}
