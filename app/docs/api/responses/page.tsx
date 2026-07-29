import ApiCodeBlock from "@/app/components/docs/ApiCodeBlock";
import CodeBlock from "@/app/components/docs/CodeBlock";
import DocsPageSection from "@/app/components/docs/DocsPageSection";
import InlineCode from "@/app/components/docs/InlineCode";

export default function ApiResponsesPage() {
	return (
		<DocsPageSection
			page="api"
			section="responses"
			header={
				<div className="space-y-4">
					<p>
						This section explains the structure of API responses so you can properly parse and use the returned data.
					</p>
				</div>
			}
			subsections={[
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
									<ApiCodeBlock language="json" url={`${process.env.NEXT_PUBLIC_URL}/api/invalid_table`} />
								</div>

								<div>
									<p className="mb-2">
										<strong>Invalid Field:</strong> Using a field name that does not exist in a filter or field
										selection.
									</p>
									<InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/project?fields=non_existent_field`} />
									<ApiCodeBlock
										language="json"
										url={`${process.env.NEXT_PUBLIC_URL}/api/project?fields=non_existent_field`}
									/>
								</div>

								<div>
									<p className="mb-2">
										<strong>Invalid Parameter Value:</strong> Providing an incorrect value for a parameter like `limit`.
									</p>
									<InlineCode code={`${process.env.NEXT_PUBLIC_URL}/api/project?limit=invalid`} />
									<ApiCodeBlock language="json" url={`${process.env.NEXT_PUBLIC_URL}/api/project?limit=invalid`} />
								</div>
							</div>
						</>
					)
				}
			]}
		/>
	);
}
