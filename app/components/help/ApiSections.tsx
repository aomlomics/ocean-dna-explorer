import { ReactNode } from "react";
import Link from "next/link";

// Define types for our content structure
export type Subsection = {
	id: string; // Used for anchor links and React keys
	title: string; // Display text in navigation and headings
	content: ReactNode; // Allows JSX content
};

export type Section = {
	id: string;
	title: string;
	content: ReactNode;
	subsections?: Subsection[]; // Optional array of subsections
};

export const apiSections: Section[] = [
	{
		id: "introduction",
		title: "Introduction",
		content: (
			<>
				<p className="mb-4">
					The NODE API provides programmatic access to marine genomic data. This documentation will help you understand 
					how to use the API to query and retrieve data from the NODE platform.
				</p>
			</>
		),
		subsections: [
			{
				id: "overview",
				title: "Overview",
				content: (
					<>
						<p className="mb-4">
							The NODE API allows you to access all available data in the database through simple HTTP requests.
							The API is designed to be simple, consistent, and easy to use, returning responses in JSON format.
						</p>
						<p className="mb-4">
							You can use this API to query projects, samples, analyses, features, and taxonomic information
							for integration into your own applications, data analysis workflows, or visualizations.
						</p>
						<p className="mb-4">
							The API is public and requires no authentication or API keys to use.
						</p>
					</>
				)
			},
			{
				id: "quick-start",
				title: "Quick Start",
				content: (
					<>
						<p className="mb-4">Here are quick examples for accessing the API:</p>
						
						<h4 className="font-medium mb-2">Viewing JSON in browser:</h4>
						<p className="mb-4">
							Simply navigate to any API endpoint in your browser to see the raw JSON response:
							<br />
							<code className="px-2 py-1 bg-base-200 rounded">https://node.example.org/api/tables</code>
						</p>
						
						<h4 className="font-medium mb-2">Python example:</h4>
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`# Python example`}<br />
							{`# Will add actual implementation later`}
						</div>
						
						<h4 className="font-medium mb-2">R example:</h4>
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`# R example`}<br />
							{`# Will add actual implementation later`}
						</div>
					</>
				)
			}
		]
	},
	{
		id: "database-schema",
		title: "Database Schema",
		content: (
			<>
				<p className="mb-4">
					Understanding the database schema is essential for effectively querying the API. 
					This section provides an overview of the tables and their relationships.
				</p>
			</>
		),
		subsections: [
			{
				id: "entity-relationship-diagram",
				title: "Entity Relationship Diagram",
				content: (
					<>
						<p className="mb-4">The following diagram shows the relationships between tables in the database:</p>
						
						<div className="border p-4 rounded-md mb-4 bg-base-200 text-center">
							{`<mermaid diagram here>`}
						</div>
						
						<p className="mb-4">
							This diagram shows how different entities relate to each other. Understanding these relationships 
							will help you construct more effective queries, especially when using the <code className="px-1 py-0.5 bg-base-200 rounded">relations</code> parameter.
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
							The NODE database consists of several tables that represent different types of data. 
							Each table has a set of fields that can be queried and filtered.
						</p>
						
						<h4 className="font-medium mt-6 mb-2">Projects Table</h4>
						<div className="overflow-x-auto mb-6">
							<table className="table table-zebra w-full">
								<thead>
									<tr>
										<th>Field</th>
										<th>Type</th>
										<th>Description</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>id</td>
										<td>integer</td>
										<td>Unique identifier for the project</td>
									</tr>
									<tr>
										<td>project_name</td>
										<td>string</td>
										<td>Name of the project</td>
									</tr>
								</tbody>
							</table>
						</div>
						
						<h4 className="font-medium mt-6 mb-2">Samples Table</h4>
						<div className="overflow-x-auto mb-6">
							<table className="table table-zebra w-full">
								<thead>
									<tr>
										<th>Field</th>
										<th>Type</th>
										<th>Description</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>id</td>
										<td>integer</td>
										<td>Unique identifier for the sample</td>
									</tr>
									<tr>
										<td>sample_id</td>
										<td>string</td>
										<td>External identifier for the sample</td>
									</tr>
								</tbody>
							</table>
						</div>
						
						<p className="mb-4">
							For a complete list of fields for each table, use the <code className="px-1 py-0.5 bg-base-200 rounded">/api/[table]/fields</code> endpoint.
						</p>
					</>
				)
			}
		]
	},
	{
		id: "query-construction",
		title: "Query Construction Guide",
		content: (
			<>
				<p className="mb-4">
					This section explains how to construct API queries to retrieve data from the NODE database.
				</p>
			</>
		),
		subsections: [
			{
				id: "url-structure",
				title: "URL Structure",
				content: (
					<>
						<p className="mb-4">API requests follow this general pattern:</p>
						
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`https://node.example.org/api/[endpoint]?[parameters]`}
						</div>
						
						<p className="mb-4">
							Where:
						</p>
						<ul className="list-disc ml-6 mb-4">
							<li><code className="px-1 py-0.5 bg-base-200 rounded">[endpoint]</code> is the name of the API endpoint (e.g., <code className="px-1 py-0.5 bg-base-200 rounded">tables</code>, <code className="px-1 py-0.5 bg-base-200 rounded">project</code>, <code className="px-1 py-0.5 bg-base-200 rounded">sample</code>)</li>
							<li><code className="px-1 py-0.5 bg-base-200 rounded">[parameters]</code> are optional query parameters to filter, sort, or limit results</li>
						</ul>
						
						<p className="mb-4">
							The base URL is followed by the API endpoint and any query parameters.
						</p>
					</>
				)
			},
			{
				id: "query-parameter-syntax",
				title: "Query Parameter Syntax",
				content: (
					<>
						<p className="mb-4">
							Query parameters are added to the URL after a question mark (<code className="px-1 py-0.5 bg-base-200 rounded">?</code>) and follow this format:
						</p>
						
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`parameter=value`}
						</div>
						
						<p className="mb-4">
							For example, to select specific fields from a table:
						</p>
						
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`/api/project?fields=id,project_name`}
						</div>
						
						<p className="mb-4">
							This requests only the <code className="px-1 py-0.5 bg-base-200 rounded">id</code> and <code className="px-1 py-0.5 bg-base-200 rounded">project_name</code> fields from the project table.
						</p>
					</>
				)
			},
			{
				id: "multiple-parameters",
				title: "Multiple Parameters",
				content: (
					<>
						<p className="mb-4">
							You can combine multiple parameters using an ampersand (<code className="px-1 py-0.5 bg-base-200 rounded">&</code>):
						</p>
						
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`/api/project?fields=id,project_name&limit=10`}
						</div>
						
						<p className="mb-4">
							This example requests only the <code className="px-1 py-0.5 bg-base-200 rounded">id</code> and <code className="px-1 py-0.5 bg-base-200 rounded">project_name</code> fields and limits the results to 10 records.
						</p>
						
						<p className="mb-4">
							Parameters can be combined in any order to create complex queries.
						</p>
					</>
				)
			},
			{
				id: "example-urls",
				title: "Example URLs",
				content: (
					<>
						<p className="mb-4">Here are some example URLs to help you understand query construction:</p>
						
						<h4 className="font-medium mb-2">Basic query:</h4>
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`/api/project?fields=id,project_name`}
						</div>
						
						<h4 className="font-medium mb-2">With relations:</h4>
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`/api/project?fields=id,project_name&relations=samples`}
						</div>
						
						<h4 className="font-medium mb-2">With filtering:</h4>
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`/api/project?project_name=Gomecc4&limit=5`}
						</div>
						
						<p className="mb-4">
							These examples demonstrate different ways to query the API. You can adjust them to suit your specific needs.
						</p>
					</>
				)
			}
		]
	},
	{
		id: "api-endpoints",
		title: "API Endpoints",
		content: (
			<>
				<p className="mb-4">
					This section documents all available API endpoints and their functionality.
				</p>
			</>
		),
		subsections: [
			{
				id: "get-all-tables",
				title: "Get All Tables",
				content: (
					<>
						<p className="mb-4">
							<strong>Endpoint:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">/api/tables</code>
						</p>
						
						<p className="mb-4">
							Returns a list of all available tables in the database. Use this to discover what data is available through the API.
						</p>
						
						<p className="mb-4">
							<strong>Example URL:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">/api/tables</code>
						</p>
						
						<p className="mb-4">
							<strong>Example Response:</strong>
						</p>
						
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`{
  "message": "Success",
  "result": [
    "project",
    "sample",
    "analysis",
    "feature",
    "taxonomy"
  ]
}`}
						</div>
					</>
				)
			},
			{
				id: "get-table-fields",
				title: "Get Table Fields",
				content: (
					<>
						<p className="mb-4">
							<strong>Endpoint:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">/api/[table]/fields</code>
						</p>
						
						<p className="mb-4">
							Returns a list of all fields available for a specific table, including their data types.
						</p>
						
						<p className="mb-4">
							<strong>Example URL:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">/api/project/fields</code>
						</p>
						
						<p className="mb-4">
							<strong>Example Response:</strong>
						</p>
						
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`{
  "message": "Success",
  "result": {
    "id": { "type": "number" },
    "project_name": { "type": "string" },
    "description": { "type": "string" },
    "created_at": { "type": "date" }
  }
}`}
						</div>
					</>
				)
			},
			{
				id: "query-table-data",
				title: "Query Table Data",
				content: (
					<>
						<p className="mb-4">
							<strong>Endpoint:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">/api/[table]</code>
						</p>
						
						<p className="mb-4">
							Returns multiple records from a specific table. This endpoint supports various query parameters for filtering, 
							selecting fields, including relations, and limiting results.
						</p>
						
						<p className="mb-4">
							<strong>Example URL:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">/api/project?fields=id,project_name&limit=5</code>
						</p>
						
						<p className="mb-4">
							<strong>Example Response:</strong>
						</p>
						
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`{
  "message": "Success",
  "result": [
    { "id": 1, "project_name": "Gulf of Mexico Metabarcoding" },
    { "id": 2, "project_name": "Atlantic Coastal eDNA Survey" },
    { "id": 3, "project_name": "GOMECC4" },
    { "id": 4, "project_name": "Pacific Microbiome Initiative" },
    { "id": 5, "project_name": "Caribbean Coral Microbiome Study" }
  ]
}`}
						</div>
					</>
				)
			},
			{
				id: "get-single-record",
				title: "Get Single Record",
				content: (
					<>
						<p className="mb-4">
							<strong>Endpoint:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">/api/[table]/[id]</code>
						</p>
						
						<p className="mb-4">
							Returns a single record from a table based on its ID. This endpoint supports parameters for 
							selecting specific fields and including related data.
						</p>
						
						<p className="mb-4">
							<strong>Example URL:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">/api/project/3?fields=id,project_name,description</code>
						</p>
						
						<p className="mb-4">
							<strong>Example Response:</strong>
						</p>
						
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`{
  "message": "Success",
  "result": {
    "id": 3,
    "project_name": "GOMECC4",
    "description": "Gulf of Mexico Ecosystems and Carbon Cycle Cruise 4"
  }
}`}
						</div>
					</>
				)
			}
		]
	},
	{
		id: "query-parameters",
		title: "Query Parameters",
		content: (
			<>
				<p className="mb-4">
					Query parameters allow you to customize your API requests. This section details all available parameters and how to use them.
				</p>
			</>
		),
		subsections: [
			{
				id: "field-selection",
				title: "Field Selection",
				content: (
					<>
						<p className="mb-4">
							<strong>Parameter:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">fields=field1,field2,field3</code>
						</p>
						
						<p className="mb-4">
							Specifies which fields to include in the response. When omitted, all fields are returned.
						</p>
						
						<p className="mb-4">
							<strong>Example URL:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">/api/project?fields=id,project_name,dateSubmitted</code>
						</p>
						
						<p className="mb-4">
							This example returns only the <code className="px-1 py-0.5 bg-base-200 rounded">id</code>, <code className="px-1 py-0.5 bg-base-200 rounded">project_name</code>, and <code className="px-1 py-0.5 bg-base-200 rounded">dateSubmitted</code> fields for each project.
						</p>
					</>
				)
			},
			{
				id: "field-filtering",
				title: "Field Filtering",
				content: (
					<>
						<p className="mb-4">
							<strong>Parameter:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">fieldName=value</code>
						</p>
						
						<p className="mb-4">
							Filters results to return only records where the specified field contains the provided value.
						</p>
						
						<p className="mb-4">
							<strong>Example URL:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">/api/project?project_name=Test</code>
						</p>
						
						<p className="mb-4">
							This example returns all projects where the <code className="px-1 py-0.5 bg-base-200 rounded">project_name</code> field contains "Test".
						</p>
					</>
				)
			},
			{
				id: "relations",
				title: "Relations",
				content: (
					<>
						<p className="mb-4">
							<strong>Parameter:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">relations=relation1,relation2</code>
						</p>
						
						<p className="mb-4">
							Includes related data from other tables in the response. The relation names can be lowercase or capitalized 
							and must be plural, separated by commas.
						</p>
						
						<p className="mb-4">
							<strong>Example URL:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">/api/project?relations=samples,analyses</code>
						</p>
						
						<p className="mb-4">
							This example returns all projects along with their related samples and analyses. By default, only the ID 
							field is included for related records.
						</p>
					</>
				)
			},
			{
				id: "relation-field-options",
				title: "Relation Field Options",
				content: (
					<>
						<p className="mb-4">
							<strong>Parameter:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">relationsAllFields=true</code> or <code className="px-1 py-0.5 bg-base-200 rounded">relationsAllFields=false</code>
						</p>
						
						<p className="mb-4">
							Controls whether to include only the ID field on relations (default), or to include all fields.
						</p>
						
						<p className="mb-4">
							<strong>Example URL:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">/api/project?relations=samples&relationsAllFields=true</code>
						</p>
						
						<p className="mb-4">
							This example returns all projects along with all fields from their related samples, not just the sample IDs.
						</p>
					</>
				)
			},
			{
				id: "id-filtering",
				title: "ID Filtering",
				content: (
					<>
						<p className="mb-4">
							<strong>Parameter:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">ids=1,2,4,7</code>
						</p>
						
						<p className="mb-4">
							Filters results to return only records with the specified IDs. IDs must be numbers greater than 0, 
							separated by commas.
						</p>
						
						<p className="mb-4">
							<strong>Example URL:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">/api/project?ids=1,2,3</code>
						</p>
						
						<p className="mb-4">
							This example returns only projects with IDs 1, 2, and 3.
						</p>
					</>
				)
			},
			{
				id: "result-limiting",
				title: "Result Limiting",
				content: (
					<>
						<p className="mb-4">
							<strong>Parameter:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">limit=number</code>
						</p>
						
						<p className="mb-4">
							Limits the number of results returned. Must be a positive number.
						</p>
						
						<p className="mb-4">
							<strong>Example URL:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">/api/project?limit=20</code>
						</p>
						
						<p className="mb-4">
							This example limits the results to 20 projects.
						</p>
					</>
				)
			}
		]
	},
	{
		id: "complete-examples",
		title: "Complete Examples",
		content: (
			<>
				<p className="mb-4">
					This section provides complete example queries to help you understand how to combine various parameters.
				</p>
			</>
		),
		subsections: [
			{
				id: "basic-query",
				title: "Basic Query",
				content: (
					<>
						<p className="mb-4">
							<strong>Example URL:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">/api/project?fields=id,project_name</code>
						</p>
						
						<p className="mb-4">
							This simple query returns just the ID and name of all projects.
						</p>
						
						<p className="mb-4">
							<strong>Example Response:</strong>
						</p>
						
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`{
  "message": "Success",
  "result": [
    { "id": 1, "project_name": "Gulf of Mexico Metabarcoding" },
    { "id": 2, "project_name": "Atlantic Coastal eDNA Survey" }
  ]
}`}
						</div>
					</>
				)
			},
			{
				id: "with-relations",
				title: "With Relations",
				content: (
					<>
						<p className="mb-4">
							<strong>Example URL:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">/api/project?relations=samples&relationsAllFields=true</code>
						</p>
						
						<p className="mb-4">
							This query returns all projects along with complete information about their related samples.
						</p>
						
						<p className="mb-4">
							<strong>Example Response:</strong>
						</p>
						
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`{
  "message": "Success",
  "result": [
    {
      "id": 1,
      "project_name": "Gulf of Mexico Metabarcoding",
      "description": "Metabarcoding study of the Gulf of Mexico",
      "samples": [
        {
          "id": 1,
          "sample_id": "GOM-001",
          "collection_date": "2022-05-15",
          "location": "Gulf of Mexico"
        },
        {
          "id": 2,
          "sample_id": "GOM-002",
          "collection_date": "2022-05-16",
          "location": "Gulf of Mexico"
        }
      ]
    }
  ]
}`}
						</div>
					</>
				)
			},
			{
				id: "with-filtering",
				title: "With Filtering",
				content: (
					<>
						<p className="mb-4">
							<strong>Example URL:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">/api/project?project_name=Test&institution=University</code>
						</p>
						
						<p className="mb-4">
							This query returns projects where the project_name contains "Test" AND the institution contains "University".
						</p>
						
						<p className="mb-4">
							<strong>Example Response:</strong>
						</p>
						
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`{
  "message": "Success",
  "result": [
    {
      "id": 10,
      "project_name": "Test Project",
      "description": "A test project",
      "institution": "University of Marine Science"
    }
  ]
}`}
						</div>
					</>
				)
			},
			{
				id: "combined-parameters",
				title: "Combined Parameters",
				content: (
					<>
						<p className="mb-4">
							<strong>Example URL:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">/api/project?fields=id,project_name&relations=samples&limit=5</code>
						</p>
						
						<p className="mb-4">
							This query combines field selection, relations, and a result limit.
						</p>
						
						<p className="mb-4">
							<strong>Example Response:</strong>
						</p>
						
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`{
  "message": "Success",
  "result": [
    {
      "id": 1,
      "project_name": "Gulf of Mexico Metabarcoding",
      "samples": [
        { "id": 1 },
        { "id": 2 }
      ]
    },
    {
      "id": 2,
      "project_name": "Atlantic Coastal eDNA Survey",
      "samples": [
        { "id": 3 },
        { "id": 4 }
      ]
    }
  ]
}`}
						</div>
					</>
				)
			},
			{
				id: "single-record",
				title: "Single Record",
				content: (
					<>
						<p className="mb-4">
							<strong>Example URL:</strong> <code className="px-1 py-0.5 bg-base-200 rounded">/api/project/5?fields=id,project_name&relations=samples</code>
						</p>
						
						<p className="mb-4">
							This query retrieves a single project by ID, with selected fields and related samples.
						</p>
						
						<p className="mb-4">
							<strong>Example Response:</strong>
						</p>
						
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`{
  "message": "Success",
  "result": {
    "id": 5,
    "project_name": "Caribbean Coral Microbiome Study",
    "samples": [
      { "id": 15 },
      { "id": 16 },
      { "id": 17 }
    ]
  }
}`}
						</div>
					</>
				)
			}
		]
	},
	{
		id: "response-format",
		title: "Response Format",
		content: (
			<>
				<p className="mb-4">
					This section explains the structure of API responses so you can properly parse and use the returned data.
				</p>
			</>
		),
		subsections: [
			{
				id: "success-structure",
				title: "Success Structure",
				content: (
					<>
						<p className="mb-4">
							Successful API responses have a consistent structure:
						</p>
						
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`{
  "message": "Success",
  "result": [
    // Array of results or single object
  ]
}`}
						</div>
						
						<p className="mb-4">
							The <code className="px-1 py-0.5 bg-base-200 rounded">message</code> field will always contain "Success" for successful requests.
						</p>
						
						<p className="mb-4">
							The <code className="px-1 py-0.5 bg-base-200 rounded">result</code> field will contain either:
						</p>
						<ul className="list-disc ml-6 mb-4">
							<li>An array of objects (for multiple results)</li>
							<li>A single object (for single record requests)</li>
						</ul>
						
						<p className="mb-4">
							[Additional response format details coming soon]
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
							Error responses follow this structure:
						</p>
						
						<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
							{`{
  "message": "Error",
  "error": "Description of what went wrong"
}`}
						</div>
						
						<p className="mb-4">
							The <code className="px-1 py-0.5 bg-base-200 rounded">message</code> field will always contain "Error" when something goes wrong.
						</p>
						
						<p className="mb-4">
							The <code className="px-1 py-0.5 bg-base-200 rounded">error</code> field contains a human-readable description of the error.
						</p>
						
						<p className="mb-4">
							[Additional error response details coming soon]
						</p>
					</>
				)
			}
		]
	},
	{
		id: "faq",
		title: "FAQ",
		content: (
			<>
				<div className="space-y-6">
					<p className="mb-4">Frequently asked questions about using the NODE API.</p>

					<div>
						<h4 className="font-medium mb-2">Q: Do I need an API key to use the NODE API?</h4>
						<p>
							A: No, the NODE API is currently open and does not require authentication or API keys.
						</p>
					</div>

					<div>
						<h4 className="font-medium mb-2">Q: Are there rate limits for API usage?</h4>
						<p>
							A: While there are no strict rate limits currently in place, we ask that you be considerate with your API usage. 
							For applications requiring high-volume requests, please contact us.
						</p>
					</div>

					<div>
						<h4 className="font-medium mb-2">Q: I'm not familiar with APIs. How do I get started?</h4>
						<p>
							A: An API (Application Programming Interface) allows computers to talk to each other. To use our API, 
							you'll need to make HTTP requests to our endpoints. The simplest way to start is by pasting one of our 
							example URLs into your browser's address bar to see the raw JSON response. For more advanced usage, 
							you can use programming languages like Python, R, or JavaScript.
						</p>
					</div>

					<div>
						<h4 className="font-medium mb-2">Q: How do I report issues with the API?</h4>
						<p>
							A: Please submit any API issues through our GitHub repository's issue tracker.
						</p>
					</div>

					<div>
						<h4 className="font-medium mb-2">Q: How do I cite data obtained through the API?</h4>
						<p>
							A: Please cite the NODE platform and the specific projects from which you obtained data. 
							Each project has citation information available through the web interface.
						</p>
					</div>
				</div>
			</>
		)
	}
];
