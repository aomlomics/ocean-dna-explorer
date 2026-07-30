export type DocsSection = Readonly<{
	title: string;
	subsections?: Readonly<Record<string, DocsSection>>;
}>;

export type DocsPage = keyof typeof DocsSections;

export type DocsGenericSection<P extends DocsPage> = keyof (typeof DocsSections)[P];

export type DocsGenericProps<P extends DocsPage> = {
	page: P;
	section: DocsGenericSection<P>;
};

type DocsNavigationElement = {
	[P in keyof typeof DocsSections]: {
		page: P;
		section: keyof (typeof DocsSections)[P];
		title: string;
	};
}[keyof typeof DocsSections];

const DocsSections = {
	help: {
		overview: {
			title: "Overview",
			subsections: {
				"features-overview": { title: "Features Overview" },
				"login-and-roles": { title: "Login and Roles" },
				"submissions-manager": { title: "Submissions Manager" },
				"contact-us": { title: "Contact Us, Report a Bug, Request a Feature" },
				"help-faq": { title: "FAQ" }
			}
		},
		search: {
			title: "Search",
			subsections: {
				"how-to-use-search": { title: "How to Use the Search Page" },
				"search-vs-explore": { title: "Search vs Explore" },
				"query-recipes": { title: "Query Examples" }
			}
		},
		explore: {
			title: "Explore",
			subsections: {
				"searching-on-explore": { title: "Searching on Explore Pages" },
				projects: { title: "Projects" },
				samples: { title: "Samples" },
				analyses: { title: "Analyses" },
				features: { title: "Features" },
				taxonomies: { title: "Taxonomies" }
			}
		},
		submit: {
			title: "Submit Data",
			subsections: {
				"example-dataset-ode-testdata": { title: "Example dataset (ODE test data)" },
				"project-submissions": { title: "Project Submissions" },
				"analysis-submissions": { title: "Analysis Submissions" },
				"data-format-rationale": { title: "Data Format Rationale" },
				"amplicon-sequence-processing": { title: "Amplicon Sequence Processing (Tourmaline)" },
				"faire-metadata-template": { title: "FAIRe Metadata Template" },
				"fill-in-metadata-templates": { title: "Fill in Metadata Templates" },
				"obis-gbif-submission": { title: "OBIS + GBIF Submission" }
			}
		}
	},
	api: {
		introduction: {
			title: "Introduction",
			subsections: {
				"how-to-use-api": {
					title: "Making Your First API Query"
				},
				"quick-start-code": {
					title: "Quick Start Code Examples"
				},
				"essential-information": {
					title: "Essential API Information"
				}
			}
		},
		schema: {
			title: "Database Schema",
			subsections: {
				"entity-relationship-diagram": {
					title: "Entity Relationship Diagram"
				},
				"table-definitions": {
					title: "Table Definitions"
				},
				editHistoryType: {
					title: "Edit History"
				}
			}
		},
		endpoints: {
			title: "API Endpoints",
			subsections: {
				"get-all-tables": {
					title: "Get All Tables"
				},
				"get-table-relations": {
					title: "Get Table Relations"
				},
				"get-table-fields": {
					title: "Get Table Fields"
				},
				"get-unique-field-values": {
					title: "Get Unique Field Values"
				},
				"query-table-data": {
					title: "Query Table Data"
				},
				"get-single-record": {
					title: "Get Single Record"
				}
			}
		},
		searching: {
			title: "Searching and Filtering",
			subsections: {
				"standard-search": {
					title: "Standard Search Parameter"
				},
				"advanced-search": {
					title: "Advanced Search Parameter"
				},
				"id-filtering": {
					title: "ID Filtering"
				},
				"direct-field-filtering": {
					title: "Direct Field Filtering"
				}
			}
		},
		queryParameters: {
			title: "Query Parameters",
			subsections: {
				"field-selection": {
					title: "Field Selection"
				},
				"field-filtering": {
					title: "Field Filtering (Legacy)"
				},
				relations: {
					title: "Relations"
				},
				"relation-field-options": {
					title: "Relation Field Options"
				},
				"id-filtering-parameter": {
					title: "ID Filtering"
				},
				"result-limiting": {
					title: "Result Limiting"
				},
				"relations-result-limiting": {
					title: "Relations Result Limiting"
				}
			}
		},
		responses: {
			title: "Response Format",
			subsections: {
				"success-structure": {
					title: "Success Structure"
				},
				"error-structure": {
					title: "Error Structure"
				}
			}
		},
		faq: {
			title: "FAQ"
		}
	}
} as const;

export default DocsSections;

export const DocsPageTitles = {
	help: "Help",
	api: "API"
} as Record<string, string>;

const DocsNavigation = Object.entries(DocsSections).flatMap(([page, sections]) =>
	Object.entries(sections).map(([id, sect]) => ({
		page: page as DocsPage,
		section: id,
		title: sect.title
	}))
) as DocsNavigationElement[];

//TODO: if only providing page, give next page with starting section
export function getNextDocsSection<P extends DocsPage>(
	{ page, section, dir = 1 }: DocsGenericProps<P> & { dir?: 1 | -1 } = {
		page: DocsNavigation[0].page,
		section: DocsNavigation[0].section
	} as DocsGenericProps<P>
): DocsNavigationElement | undefined {
	return DocsNavigation[DocsNavigation.findIndex((item) => item.page === page && item.section === section) + dir];
}
