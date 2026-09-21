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
				"trusted-vs-untrusted-data": { title: "Trusted vs Untrusted Data" },
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
				"rate-limits": {
					title: "Rate Limits"
				},
				"quick-start-code": {
					title: "Quick Start Code Examples"
				},
				"api-rules": {
					title: "Rules to Know"
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
				"table-names": {
					title: "Table Names in URLs"
				},
				"get-all-tables": {
					title: "Get All Tables"
				},
				"get-table-fields": {
					title: "Get Table Fields"
				},
				"get-table-relations": {
					title: "Get Table Relations"
				},
				"get-unique-field-values": {
					title: "Get Unique Field Values"
				},
				"query-table-data": {
					title: "Query Table Data"
				},
				"count-records": {
					title: "Count Records"
				},
				"get-single-record": {
					title: "Get Single Record"
				},
				"get-dead-values": {
					title: "Get Dead Values"
				},
				"get-users": {
					title: "Get Users"
				},
				"options-by-endpoint": {
					title: "Options by Endpoint"
				}
			}
		},
		searching: {
			title: "Filtering and Searching",
			subsections: {
				"direct-field-filtering": {
					title: "Direct Field Filtering"
				},
				"standard-search": {
					title: "Standard Search"
				},
				"id-filtering": {
					title: "ID Filtering"
				},
				"advanced-search": {
					title: "Advanced Search"
				},
				"spatial-search": {
					title: "Spatial Search"
				},
				"blast-search": {
					title: "BLAST Search"
				}
			}
		},
		queryParameters: {
			title: "Query Options",
			subsections: {
				"trusted-data": {
					title: "Trusted Data"
				},
				"field-selection": {
					title: "Field Selection"
				},
				relations: {
					title: "Relations"
				},
				"relation-field-options": {
					title: "Relation Fields"
				},
				"relation-counts": {
					title: "Relation Counts"
				},
				"sorting-results": {
					title: "Sorting Results"
				},
				"distinct-values": {
					title: "Distinct Values"
				},
				"result-limiting": {
					title: "Limits and Pagination"
				},
				"ignore-extra-options": {
					title: "Ignoring Extra Options"
				}
			}
		},
		recipes: {
			title: "Common Queries",
			subsections: {
				"recipe-discover": {
					title: "Discover a Table"
				},
				"recipe-filter": {
					title: "Filter and Trim a Table"
				},
				"recipe-related": {
					title: "Get Related Records"
				},
				"recipe-deep": {
					title: "Reach Across Tables"
				},
				"recipe-counts": {
					title: "Count Without Downloading"
				},
				"recipe-pagination": {
					title: "Page Through Large Tables"
				},
				"recipe-distinct": {
					title: "Find Unique Combinations"
				},
				"recipe-submitters": {
					title: "Look Up Who Submitted Data"
				}
			}
		},
		responses: {
			title: "Response Format",
			subsections: {
				"success-structure": {
					title: "Success Structure"
				},
				"result-by-endpoint": {
					title: "Result Shape by Endpoint"
				},
				"error-structure": {
					title: "Error Structure"
				},
				"common-errors": {
					title: "Common Errors"
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
) as [DocsNavigationElement, ...DocsNavigationElement[]];

//TODO: if only providing page, give next page with starting section
export function getNextDocsSection<P extends DocsPage>(
	{ page, section, dir = 1 }: DocsGenericProps<P> & { dir?: 1 | -1 } = {
		page: DocsNavigation[0].page,
		section: DocsNavigation[0].section
	} as DocsGenericProps<P>
): DocsNavigationElement | undefined {
	return DocsNavigation[DocsNavigation.findIndex((item) => item.page === page && item.section === section) + dir];
}
