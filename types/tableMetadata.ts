//AUTO-GENERATED - DO NOT EDIT

import * as PrismaZodTypes from "@/prisma/generated/zod";
import type { Prisma } from "@/app/generated/prisma/browser";
import type { ZodEnum, ZodObject } from "zod";
import { capitalizeTable } from "@/app/helpers/utils";

export type ModelName = Prisma.ModelName;

export type RelationMetadata = Readonly<{
	field: string;
	table: ModelName;
	type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
}>;

type RelationPaths = Partial<
	Record<Uncapitalize<ModelName> | ModelName, readonly [RelationMetadata, ...RelationMetadata[]]>
>;

export type TableMetadataValue = Readonly<{
	plural: string;
	description: string;
	schema: Readonly<ZodObject<Record<string, any>>>;
	enumSchema: Readonly<ZodEnum<Record<string, string>>>;
	relations: readonly RelationMetadata[];
	relationPaths: Readonly<RelationPaths>;
	titleField: string | readonly string[];
	subFields?: readonly string[];
	fieldOrder?: readonly string[];
}>;

const TableMetadata = {
	project: {
		plural: "Projects",
		description: "Research initiatives collecting eDNA samples, with metadata on study design, objectives, and participating institutions.",
		schema: PrismaZodTypes.ProjectSchema,
		enumSchema: PrismaZodTypes.ProjectScalarFieldEnumSchema,
		titleField: "project_id",
		subFields: [
			"Samples",
			"Libraries",
			"Analyses",
			"project_name",
			"study_factor",
			"institution",
			"project_contact",
			"sample_type"
		],
		fieldOrder: [
			"project_name",
			"project_contact",
			"institution",
			"institutionID",
			"recordedBy",
			"recordedByID",
			"study_factor",
			"assay_type"
		],
		relations: [
			{
				field: "Samples",
				table: "Sample",
				type: "one-to-many"
			},
			{
				field: "AssayPreps",
				table: "AssayPrep",
				type: "one-to-many"
			},
			{
				field: "Libraries",
				table: "Library",
				type: "one-to-many"
			},
			{
				field: "Analyses",
				table: "Analysis",
				type: "one-to-many"
			},
			{
				field: "Occurrences",
				table: "Occurrence",
				type: "one-to-many"
			},
			{
				field: "Assignments",
				table: "Assignment",
				type: "one-to-many"
			},
			{
				field: "AlphaDiversities",
				table: "AlphaDiversity",
				type: "one-to-many"
			},
			{
				field: "AlphaDiversityIndexes",
				table: "AlphaDiversityIndex",
				type: "one-to-many"
			},
			{
				field: "TaxonomySpotlights",
				table: "TaxonomySpotlight",
				type: "one-to-many"
			}
		],
		relationPaths: {
			sample: [
				{
					field: "Samples",
					table: "Sample",
					type: "one-to-many"
				}
			],
			Sample: [
				{
					field: "Samples",
					table: "Sample",
					type: "one-to-many"
				}
			],
			assay: [
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			Assay: [
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			assayPrep: [
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				}
			],
			AssayPrep: [
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				}
			],
			library: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				}
			],
			Library: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				}
			],
			analysis: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				}
			],
			Analysis: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				}
			],
			occurrence: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			Occurrence: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			feature: [
				{
					field: "Samples",
					table: "Sample",
					type: "one-to-many"
				},
				{
					field: "Features",
					table: "Feature",
					type: "many-to-many"
				}
			],
			Feature: [
				{
					field: "Samples",
					table: "Sample",
					type: "one-to-many"
				},
				{
					field: "Features",
					table: "Feature",
					type: "many-to-many"
				}
			],
			assignment: [
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				}
			],
			Assignment: [
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				}
			],
			taxonomy: [
				{
					field: "Samples",
					table: "Sample",
					type: "one-to-many"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			Taxonomy: [
				{
					field: "Samples",
					table: "Sample",
					type: "one-to-many"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			taxonomySpotlight: [
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			TaxonomySpotlight: [
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			tag: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			Tag: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			alphaDiversity: [
				{
					field: "AlphaDiversities",
					table: "AlphaDiversity",
					type: "one-to-many"
				}
			],
			AlphaDiversity: [
				{
					field: "AlphaDiversities",
					table: "AlphaDiversity",
					type: "one-to-many"
				}
			],
			alphaDiversityIndex: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			AlphaDiversityIndex: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			blastQuery: [
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			BlastQuery: [
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			blastQueryResult: [
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			],
			BlastQueryResult: [
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			]
		}
	},
	sample: {
		plural: "Samples",
		description: "Environmental material samples, such as water or soil, collected for analysis with metadata on collection, environmental conditions, storage, and processing methods.",
		schema: PrismaZodTypes.SampleSchema,
		enumSchema: PrismaZodTypes.SampleScalarFieldEnumSchema,
		titleField: [
			"project_id",
			"samp_name"
		],
		subFields: [
			"Libraries",
			"Taxonomies",
			"geo_loc_name"
		],
		fieldOrder: [
			"samp_name",
			"eventDate",
			"decimalLatitude",
			"decimalLongitude",
			"minimumDepthInMeters",
			"maximumDepthInMeters",
			"tot_depth_water_col",
			"geo_loc_name",
			"env_broad_scale",
			"env_local_scale",
			"env_medium",
			"samp_category",
			"neg_cont_type",
			"pos_cont_type",
			"expedition_id",
			"line_id",
			"station_id",
			"serial_number"
		],
		relations: [
			{
				field: "Project",
				table: "Project",
				type: "many-to-one"
			},
			{
				field: "Libraries",
				table: "Library",
				type: "one-to-many"
			},
			{
				field: "Features",
				table: "Feature",
				type: "many-to-many"
			},
			{
				field: "Taxonomies",
				table: "Taxonomy",
				type: "many-to-many"
			}
		],
		relationPaths: {
			project: [
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			Project: [
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			assay: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			Assay: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			assayPrep: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			AssayPrep: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			library: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				}
			],
			Library: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				}
			],
			analysis: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				}
			],
			Analysis: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				}
			],
			occurrence: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			Occurrence: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			feature: [
				{
					field: "Features",
					table: "Feature",
					type: "many-to-many"
				}
			],
			Feature: [
				{
					field: "Features",
					table: "Feature",
					type: "many-to-many"
				}
			],
			assignment: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				}
			],
			Assignment: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				}
			],
			taxonomy: [
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			Taxonomy: [
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			taxonomySpotlight: [
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			TaxonomySpotlight: [
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			tag: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			Tag: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			alphaDiversity: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			AlphaDiversity: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			alphaDiversityIndex: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			AlphaDiversityIndex: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			blastQuery: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			BlastQuery: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			blastQueryResult: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			],
			BlastQueryResult: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			]
		}
	},
	assay: {
		plural: "Assays",
		description: "Molecular targets, primer sequences, primer references, and expected amplicon sizes for specific molecular analyses.",
		schema: PrismaZodTypes.AssaySchema,
		enumSchema: PrismaZodTypes.AssayScalarFieldEnumSchema,
		titleField: "assay_name",
		subFields: [
			"AssayPreps",
			"Analyses",
			"pcr_primer_name_forward",
			"pcr_primer_forward",
			"pcr_primer_name_reverse",
			"pcr_primer_reverse"
		],
		relations: [
			{
				field: "AssayPreps",
				table: "AssayPrep",
				type: "one-to-many"
			},
			{
				field: "Libraries",
				table: "Library",
				type: "one-to-many"
			},
			{
				field: "Analyses",
				table: "Analysis",
				type: "one-to-many"
			},
			{
				field: "BlastQueries",
				table: "BlastQuery",
				type: "one-to-many"
			}
		],
		relationPaths: {
			project: [
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				},
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			Project: [
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				},
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			sample: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			Sample: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			assayPrep: [
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				}
			],
			AssayPrep: [
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				}
			],
			library: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				}
			],
			Library: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				}
			],
			analysis: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				}
			],
			Analysis: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				}
			],
			occurrence: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			Occurrence: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			feature: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Features",
					table: "Feature",
					type: "many-to-many"
				}
			],
			Feature: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Features",
					table: "Feature",
					type: "many-to-many"
				}
			],
			assignment: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				},
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				}
			],
			Assignment: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				},
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				}
			],
			taxonomy: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			Taxonomy: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			taxonomySpotlight: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			TaxonomySpotlight: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			tag: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			Tag: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			alphaDiversity: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversities",
					table: "AlphaDiversity",
					type: "one-to-many"
				}
			],
			AlphaDiversity: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversities",
					table: "AlphaDiversity",
					type: "one-to-many"
				}
			],
			alphaDiversityIndex: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			AlphaDiversityIndex: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			blastQuery: [
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			BlastQuery: [
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			blastQueryResult: [
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			],
			BlastQueryResult: [
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			]
		}
	},
	assayPrep: {
		plural: "AssayPreps",
		description: "Protocol-specific details describing the laboratory procedures used to perform an assay, such as the chemicals, instruments, and conditions employed for sample processing and sequencing.",
		schema: PrismaZodTypes.AssayPrepSchema,
		enumSchema: PrismaZodTypes.AssayPrepScalarFieldEnumSchema,
		titleField: [
			"project_id",
			"assay_name"
		],
		fieldOrder: [
			"assay_type",
			"thermocycler",
			"commercial_mm",
			"custom_mm",
			"pcr_cond",
			"amplificationReactionVolume",
			"assay_validation",
			"pcr_primer_vol_forward",
			"pcr_primer_vol_reverse",
			"pcr_primer_conc_forward",
			"pcr_primer_conc_reverse",
			"probe_seq",
			"probe_conc",
			"pcr_dna_vol",
			"pcr_rep",
			"pcr_cycles"
		],
		relations: [
			{
				field: "Project",
				table: "Project",
				type: "many-to-one"
			},
			{
				field: "Assay",
				table: "Assay",
				type: "many-to-one"
			},
			{
				field: "Libraries",
				table: "Library",
				type: "one-to-many"
			}
		],
		relationPaths: {
			project: [
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			Project: [
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			sample: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			Sample: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			assay: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			Assay: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			library: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				}
			],
			Library: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				}
			],
			analysis: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				}
			],
			Analysis: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				}
			],
			occurrence: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			Occurrence: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			feature: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Features",
					table: "Feature",
					type: "many-to-many"
				}
			],
			Feature: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Features",
					table: "Feature",
					type: "many-to-many"
				}
			],
			assignment: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				}
			],
			Assignment: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				}
			],
			taxonomy: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			Taxonomy: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			taxonomySpotlight: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			TaxonomySpotlight: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			tag: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			Tag: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			alphaDiversity: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			AlphaDiversity: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			alphaDiversityIndex: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			AlphaDiversityIndex: [
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			blastQuery: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			BlastQuery: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			blastQueryResult: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			],
			BlastQueryResult: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			]
		}
	},
	library: {
		plural: "Libraries",
		description: "Collections of sequencing library molecular preparation details (PCR amplification and indexing), the sequencing instrumentation and run parameters, and metadata for the generated DNA sequence files.",
		schema: PrismaZodTypes.LibrarySchema,
		enumSchema: PrismaZodTypes.LibraryScalarFieldEnumSchema,
		titleField: [
			"project_id",
			"lib_id"
		],
		subFields: [
			"Sample",
			"assay_name",
			"seq_run_id"
		],
		fieldOrder: [
			"samp_name",
			"seq_run_id",
			"platform",
			"instrument",
			"seq_kit",
			"lib_layout",
			"input_read_count",
			"lib_conc",
			"lib_conc_unit",
			"phix_perc"
		],
		relations: [
			{
				field: "Project",
				table: "Project",
				type: "many-to-one"
			},
			{
				field: "Sample",
				table: "Sample",
				type: "many-to-one"
			},
			{
				field: "Assay",
				table: "Assay",
				type: "many-to-one"
			},
			{
				field: "AssayPrep",
				table: "AssayPrep",
				type: "many-to-one"
			},
			{
				field: "Analyses",
				table: "Analysis",
				type: "many-to-many"
			},
			{
				field: "Occurrences",
				table: "Occurrence",
				type: "one-to-many"
			},
			{
				field: "AlphaDiversityIndexes",
				table: "AlphaDiversityIndex",
				type: "one-to-many"
			}
		],
		relationPaths: {
			project: [
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			Project: [
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			sample: [
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			Sample: [
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			assay: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			Assay: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			assayPrep: [
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			AssayPrep: [
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			analysis: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				}
			],
			Analysis: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				}
			],
			occurrence: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			Occurrence: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			feature: [
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Features",
					table: "Feature",
					type: "many-to-many"
				}
			],
			Feature: [
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Features",
					table: "Feature",
					type: "many-to-many"
				}
			],
			assignment: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				}
			],
			Assignment: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				}
			],
			taxonomy: [
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			Taxonomy: [
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			taxonomySpotlight: [
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			TaxonomySpotlight: [
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			tag: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			Tag: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			alphaDiversity: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			AlphaDiversity: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			alphaDiversityIndex: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			AlphaDiversityIndex: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			blastQuery: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			BlastQuery: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			blastQueryResult: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			],
			BlastQueryResult: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			]
		}
	},
	analysis: {
		plural: "Analyses",
		description: "Bioinformatic processing runs that convert raw sequence data into Occurrences (counts) of Features (DNA sequences), documenting all parameters and methods used.",
		schema: PrismaZodTypes.AnalysisSchema,
		enumSchema: PrismaZodTypes.AnalysisScalarFieldEnumSchema,
		titleField: [
			"project_id",
			"analysis_run_name"
		],
		subFields: [
			"assay_name",
			"Features",
			"Taxonomies",
			"trusted"
		],
		relations: [
			{
				field: "Project",
				table: "Project",
				type: "many-to-one"
			},
			{
				field: "Assay",
				table: "Assay",
				type: "many-to-one"
			},
			{
				field: "Libraries",
				table: "Library",
				type: "many-to-many"
			},
			{
				field: "Occurrences",
				table: "Occurrence",
				type: "one-to-many"
			},
			{
				field: "Assignments",
				table: "Assignment",
				type: "one-to-many"
			},
			{
				field: "Taxonomies",
				table: "Taxonomy",
				type: "many-to-many"
			},
			{
				field: "Tags",
				table: "Tag",
				type: "many-to-many"
			},
			{
				field: "AlphaDiversities",
				table: "AlphaDiversity",
				type: "one-to-many"
			}
		],
		relationPaths: {
			project: [
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			Project: [
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			sample: [
				{
					field: "Libraries",
					table: "Library",
					type: "many-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			Sample: [
				{
					field: "Libraries",
					table: "Library",
					type: "many-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			assay: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			Assay: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			assayPrep: [
				{
					field: "Libraries",
					table: "Library",
					type: "many-to-many"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			AssayPrep: [
				{
					field: "Libraries",
					table: "Library",
					type: "many-to-many"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			library: [
				{
					field: "Libraries",
					table: "Library",
					type: "many-to-many"
				}
			],
			Library: [
				{
					field: "Libraries",
					table: "Library",
					type: "many-to-many"
				}
			],
			occurrence: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			Occurrence: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			feature: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Feature",
					table: "Feature",
					type: "many-to-one"
				}
			],
			Feature: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Feature",
					table: "Feature",
					type: "many-to-one"
				}
			],
			assignment: [
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				}
			],
			Assignment: [
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				}
			],
			taxonomy: [
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			Taxonomy: [
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			taxonomySpotlight: [
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			TaxonomySpotlight: [
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			tag: [
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			Tag: [
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			alphaDiversity: [
				{
					field: "AlphaDiversities",
					table: "AlphaDiversity",
					type: "one-to-many"
				}
			],
			AlphaDiversity: [
				{
					field: "AlphaDiversities",
					table: "AlphaDiversity",
					type: "one-to-many"
				}
			],
			alphaDiversityIndex: [
				{
					field: "AlphaDiversities",
					table: "AlphaDiversity",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			AlphaDiversityIndex: [
				{
					field: "AlphaDiversities",
					table: "AlphaDiversity",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			blastQuery: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			BlastQuery: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			blastQueryResult: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			],
			BlastQueryResult: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			]
		}
	},
	occurrence: {
		plural: "Occurrences",
		description: "Individual detection records linking samples to specific Features (DNA sequences), including their quantified abundance as determined by the analysis of sequencing data.",
		schema: PrismaZodTypes.OccurrenceSchema,
		enumSchema: PrismaZodTypes.OccurrenceScalarFieldEnumSchema,
		titleField: [
			"project_id",
			"analysis_run_name",
			"lib_id",
			"featureid"
		],
		subFields: [
			"Analysis",
			"Library",
			"organismQuantity"
		],
		relations: [
			{
				field: "Project",
				table: "Project",
				type: "many-to-one"
			},
			{
				field: "Analysis",
				table: "Analysis",
				type: "many-to-one"
			},
			{
				field: "Library",
				table: "Library",
				type: "many-to-one"
			},
			{
				field: "Feature",
				table: "Feature",
				type: "many-to-one"
			},
			{
				field: "Assignment",
				table: "Assignment",
				type: "many-to-one"
			}
		],
		relationPaths: {
			project: [
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			Project: [
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			sample: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			Sample: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			assay: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			Assay: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			assayPrep: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			AssayPrep: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			library: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				}
			],
			Library: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				}
			],
			analysis: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				}
			],
			Analysis: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				}
			],
			feature: [
				{
					field: "Feature",
					table: "Feature",
					type: "many-to-one"
				}
			],
			Feature: [
				{
					field: "Feature",
					table: "Feature",
					type: "many-to-one"
				}
			],
			assignment: [
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				}
			],
			Assignment: [
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				}
			],
			taxonomy: [
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				},
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				}
			],
			Taxonomy: [
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				},
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				}
			],
			taxonomySpotlight: [
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				},
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			TaxonomySpotlight: [
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				},
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			tag: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			Tag: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			alphaDiversity: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			AlphaDiversity: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			alphaDiversityIndex: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			AlphaDiversityIndex: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			blastQuery: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			BlastQuery: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			blastQueryResult: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			],
			BlastQueryResult: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			]
		}
	},
	feature: {
		plural: "Features",
		description: "Unique DNA sequences (e.g., ASVs) found in samples, typically representing distinct organisms, with their taxonomic classifications.",
		schema: PrismaZodTypes.FeatureSchema,
		enumSchema: PrismaZodTypes.FeatureScalarFieldEnumSchema,
		titleField: "featureid",
		subFields: [
			"Analyses",
			"dna_sequence",
			"sequenceLength_ODE"
		],
		relations: [
			{
				field: "Samples",
				table: "Sample",
				type: "many-to-many"
			},
			{
				field: "Occurrences",
				table: "Occurrence",
				type: "one-to-many"
			},
			{
				field: "Assignments",
				table: "Assignment",
				type: "one-to-many"
			},
			{
				field: "BlastQueryResults",
				table: "BlastQueryResult",
				type: "one-to-many"
			}
		],
		relationPaths: {
			project: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			Project: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			sample: [
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				}
			],
			Sample: [
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				}
			],
			assay: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			Assay: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			assayPrep: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			AssayPrep: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			library: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				}
			],
			Library: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				}
			],
			analysis: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				}
			],
			Analysis: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				}
			],
			occurrence: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			Occurrence: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			assignment: [
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				}
			],
			Assignment: [
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				}
			],
			taxonomy: [
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				},
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				}
			],
			Taxonomy: [
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				},
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				}
			],
			taxonomySpotlight: [
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				},
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			TaxonomySpotlight: [
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				},
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			tag: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			Tag: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			alphaDiversity: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			AlphaDiversity: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			alphaDiversityIndex: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			AlphaDiversityIndex: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			blastQuery: [
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				},
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				}
			],
			BlastQuery: [
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				},
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				}
			],
			blastQueryResult: [
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			],
			BlastQueryResult: [
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			]
		}
	},
	assignment: {
		plural: "Assignments",
		description: "Taxonomic assignments for each Feature (DNA sequence) to a specific organism, including the confidence of the assignment.",
		schema: PrismaZodTypes.AssignmentSchema,
		enumSchema: PrismaZodTypes.AssignmentScalarFieldEnumSchema,
		titleField: [
			"project_id",
			"analysis_run_name",
			"featureid"
		],
		subFields: [
			"Analysis",
			"taxonomy",
			"Confidence"
		],
		relations: [
			{
				field: "Project",
				table: "Project",
				type: "many-to-one"
			},
			{
				field: "Analysis",
				table: "Analysis",
				type: "many-to-one"
			},
			{
				field: "Feature",
				table: "Feature",
				type: "many-to-one"
			},
			{
				field: "Taxonomy",
				table: "Taxonomy",
				type: "many-to-one"
			},
			{
				field: "Occurrences",
				table: "Occurrence",
				type: "one-to-many"
			}
		],
		relationPaths: {
			project: [
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			Project: [
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			sample: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			Sample: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			assay: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			Assay: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			assayPrep: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			AssayPrep: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			library: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				}
			],
			Library: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				}
			],
			analysis: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				}
			],
			Analysis: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				}
			],
			occurrence: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			Occurrence: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			feature: [
				{
					field: "Feature",
					table: "Feature",
					type: "many-to-one"
				}
			],
			Feature: [
				{
					field: "Feature",
					table: "Feature",
					type: "many-to-one"
				}
			],
			taxonomy: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				}
			],
			Taxonomy: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				}
			],
			taxonomySpotlight: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			TaxonomySpotlight: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			tag: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			Tag: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			alphaDiversity: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			AlphaDiversity: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			alphaDiversityIndex: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			AlphaDiversityIndex: [
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			blastQuery: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			BlastQuery: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			blastQueryResult: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			],
			BlastQueryResult: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			]
		}
	},
	taxonomy: {
		plural: "Taxonomies",
		description: "The scientific classification of organisms into a hierarchical system.",
		schema: PrismaZodTypes.TaxonomySchema,
		enumSchema: PrismaZodTypes.TaxonomyScalarFieldEnumSchema,
		titleField: "taxonomy",
		subFields: [
			"Analyses",
			"Samples",
			"realm",
			"subrealm",
			"domain",
			"superkingdom",
			"supergroup",
			"kingdom",
			"infrakingdom",
			"subkingdom",
			"phylum",
			"division",
			"subphylum",
			"subdivision",
			"class",
			"subclass",
			"section",
			"subsection",
			"order",
			"suborder",
			"family",
			"subfamily",
			"genus",
			"subgenus",
			"species",
			"subspecies",
			"varietas",
			"forma",
			"biovar",
			"serovar",
			"pathovar",
			"strain",
			"clade",
			"lineage",
			"group",
			"type"
		],
		relations: [
			{
				field: "Analyses",
				table: "Analysis",
				type: "many-to-many"
			},
			{
				field: "Samples",
				table: "Sample",
				type: "many-to-many"
			},
			{
				field: "Assignments",
				table: "Assignment",
				type: "one-to-many"
			},
			{
				field: "TaxonomySpotlights",
				table: "TaxonomySpotlight",
				type: "one-to-many"
			}
		],
		relationPaths: {
			project: [
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				},
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			Project: [
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				},
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			sample: [
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				}
			],
			Sample: [
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				}
			],
			assay: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			Assay: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			assayPrep: [
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			AssayPrep: [
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			library: [
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				}
			],
			Library: [
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				}
			],
			analysis: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				}
			],
			Analysis: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				}
			],
			occurrence: [
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			Occurrence: [
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			feature: [
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				},
				{
					field: "Feature",
					table: "Feature",
					type: "many-to-one"
				}
			],
			Feature: [
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				},
				{
					field: "Feature",
					table: "Feature",
					type: "many-to-one"
				}
			],
			assignment: [
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				}
			],
			Assignment: [
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				}
			],
			taxonomySpotlight: [
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			TaxonomySpotlight: [
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			tag: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			Tag: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			alphaDiversity: [
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			AlphaDiversity: [
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			alphaDiversityIndex: [
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			AlphaDiversityIndex: [
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			blastQuery: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			BlastQuery: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			blastQueryResult: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			],
			BlastQueryResult: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			]
		}
	},
	taxonomySpotlight: {
		plural: "TaxonomySpotlights",
		description: "",
		schema: PrismaZodTypes.TaxonomySpotlightSchema,
		enumSchema: PrismaZodTypes.TaxonomySpotlightScalarFieldEnumSchema,
		titleField: [
			"project_id",
			"taxonomy"
		],
		relations: [
			{
				field: "Project",
				table: "Project",
				type: "many-to-one"
			},
			{
				field: "Taxonomy",
				table: "Taxonomy",
				type: "many-to-one"
			}
		],
		relationPaths: {
			project: [
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			Project: [
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			sample: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				}
			],
			Sample: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				}
			],
			assay: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			Assay: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			assayPrep: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			AssayPrep: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			library: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				}
			],
			Library: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				}
			],
			analysis: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				}
			],
			Analysis: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				}
			],
			occurrence: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			Occurrence: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			feature: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				},
				{
					field: "Feature",
					table: "Feature",
					type: "many-to-one"
				}
			],
			Feature: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				},
				{
					field: "Feature",
					table: "Feature",
					type: "many-to-one"
				}
			],
			assignment: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				}
			],
			Assignment: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				}
			],
			taxonomy: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				}
			],
			Taxonomy: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				}
			],
			tag: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			Tag: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			alphaDiversity: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			AlphaDiversity: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			alphaDiversityIndex: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			AlphaDiversityIndex: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Samples",
					table: "Sample",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			blastQuery: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			BlastQuery: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			blastQueryResult: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			],
			BlastQueryResult: [
				{
					field: "Taxonomy",
					table: "Taxonomy",
					type: "many-to-one"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			]
		}
	},
	tag: {
		plural: "Tags",
		description: "",
		schema: PrismaZodTypes.TagSchema,
		enumSchema: PrismaZodTypes.TagScalarFieldEnumSchema,
		titleField: "tagName",
		relations: [
			{
				field: "Analyses",
				table: "Analysis",
				type: "many-to-many"
			}
		],
		relationPaths: {
			project: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			Project: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			sample: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "many-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			Sample: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "many-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			assay: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			Assay: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			assayPrep: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "many-to-many"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			AssayPrep: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "many-to-many"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			library: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "many-to-many"
				}
			],
			Library: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "many-to-many"
				}
			],
			analysis: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				}
			],
			Analysis: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				}
			],
			occurrence: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			Occurrence: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			feature: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Feature",
					table: "Feature",
					type: "many-to-one"
				}
			],
			Feature: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Feature",
					table: "Feature",
					type: "many-to-one"
				}
			],
			assignment: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				}
			],
			Assignment: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assignments",
					table: "Assignment",
					type: "one-to-many"
				}
			],
			taxonomy: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			Taxonomy: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			taxonomySpotlight: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			TaxonomySpotlight: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			alphaDiversity: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "AlphaDiversities",
					table: "AlphaDiversity",
					type: "one-to-many"
				}
			],
			AlphaDiversity: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "AlphaDiversities",
					table: "AlphaDiversity",
					type: "one-to-many"
				}
			],
			alphaDiversityIndex: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "AlphaDiversities",
					table: "AlphaDiversity",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			AlphaDiversityIndex: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "AlphaDiversities",
					table: "AlphaDiversity",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			blastQuery: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			BlastQuery: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			blastQueryResult: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			],
			BlastQueryResult: [
				{
					field: "Analyses",
					table: "Analysis",
					type: "many-to-many"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			]
		}
	},
	alphaDiversity: {
		plural: "AlphaDiversities",
		description: "",
		schema: PrismaZodTypes.AlphaDiversitySchema,
		enumSchema: PrismaZodTypes.AlphaDiversityScalarFieldEnumSchema,
		titleField: "id",
		relations: [
			{
				field: "Project",
				table: "Project",
				type: "many-to-one"
			},
			{
				field: "Analysis",
				table: "Analysis",
				type: "many-to-one"
			},
			{
				field: "AlphaDiversityIndexes",
				table: "AlphaDiversityIndex",
				type: "one-to-many"
			}
		],
		relationPaths: {
			project: [
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			Project: [
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			sample: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			Sample: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			assay: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			Assay: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			assayPrep: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			AssayPrep: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			library: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				}
			],
			Library: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				}
			],
			analysis: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				}
			],
			Analysis: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				}
			],
			occurrence: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			Occurrence: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			feature: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Features",
					table: "Feature",
					type: "many-to-many"
				}
			],
			Feature: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Features",
					table: "Feature",
					type: "many-to-many"
				}
			],
			assignment: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				}
			],
			Assignment: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				}
			],
			taxonomy: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			Taxonomy: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			taxonomySpotlight: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			TaxonomySpotlight: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			tag: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			Tag: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			alphaDiversityIndex: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			AlphaDiversityIndex: [
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			blastQuery: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			BlastQuery: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			blastQueryResult: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			],
			BlastQueryResult: [
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			]
		}
	},
	alphaDiversityIndex: {
		plural: "AlphaDiversityIndexes",
		description: "",
		schema: PrismaZodTypes.AlphaDiversityIndexSchema,
		enumSchema: PrismaZodTypes.AlphaDiversityIndexScalarFieldEnumSchema,
		titleField: "id",
		relations: [
			{
				field: "Project",
				table: "Project",
				type: "many-to-one"
			},
			{
				field: "Library",
				table: "Library",
				type: "many-to-one"
			},
			{
				field: "AlphaDiversity",
				table: "AlphaDiversity",
				type: "many-to-one"
			}
		],
		relationPaths: {
			project: [
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			Project: [
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			sample: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			Sample: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			assay: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			Assay: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			assayPrep: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			AssayPrep: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "AssayPrep",
					table: "AssayPrep",
					type: "many-to-one"
				}
			],
			library: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				}
			],
			Library: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				}
			],
			analysis: [
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				},
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				}
			],
			Analysis: [
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				},
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				}
			],
			occurrence: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			Occurrence: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			feature: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Features",
					table: "Feature",
					type: "many-to-many"
				}
			],
			Feature: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Features",
					table: "Feature",
					type: "many-to-many"
				}
			],
			assignment: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				}
			],
			Assignment: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				}
			],
			taxonomy: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			Taxonomy: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			taxonomySpotlight: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			TaxonomySpotlight: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			tag: [
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				},
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			Tag: [
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				},
				{
					field: "Analysis",
					table: "Analysis",
					type: "many-to-one"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			alphaDiversity: [
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			AlphaDiversity: [
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			blastQuery: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			BlastQuery: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				}
			],
			blastQueryResult: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			],
			BlastQueryResult: [
				{
					field: "Library",
					table: "Library",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "BlastQueries",
					table: "BlastQuery",
					type: "one-to-many"
				},
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			]
		}
	},
	blastQuery: {
		plural: "BlastQueries",
		description: "",
		schema: PrismaZodTypes.BlastQuerySchema,
		enumSchema: PrismaZodTypes.BlastQueryScalarFieldEnumSchema,
		titleField: "id",
		relations: [
			{
				field: "Assay",
				table: "Assay",
				type: "many-to-one"
			},
			{
				field: "BlastQueryResults",
				table: "BlastQueryResult",
				type: "one-to-many"
			}
		],
		relationPaths: {
			project: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				},
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			Project: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				},
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			sample: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			Sample: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			assay: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			Assay: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			assayPrep: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				}
			],
			AssayPrep: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				}
			],
			library: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				}
			],
			Library: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				}
			],
			analysis: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				}
			],
			Analysis: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				}
			],
			occurrence: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			Occurrence: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			feature: [
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				},
				{
					field: "Feature",
					table: "Feature",
					type: "many-to-one"
				}
			],
			Feature: [
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				},
				{
					field: "Feature",
					table: "Feature",
					type: "many-to-one"
				}
			],
			assignment: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				}
			],
			Assignment: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				}
			],
			taxonomy: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			Taxonomy: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			taxonomySpotlight: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			TaxonomySpotlight: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			tag: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			Tag: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			alphaDiversity: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			AlphaDiversity: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			alphaDiversityIndex: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			AlphaDiversityIndex: [
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			blastQueryResult: [
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			],
			BlastQueryResult: [
				{
					field: "BlastQueryResults",
					table: "BlastQueryResult",
					type: "one-to-many"
				}
			]
		}
	},
	blastQueryResult: {
		plural: "BlastQueryResults",
		description: "",
		schema: PrismaZodTypes.BlastQueryResultSchema,
		enumSchema: PrismaZodTypes.BlastQueryResultScalarFieldEnumSchema,
		titleField: "id",
		fieldOrder: [
			"percentIdentity",
			"eValue",
			"alignmentLength",
			"bitScore",
			"mismatches",
			"queryStart",
			"gapOpens",
			"subjectStart"
		],
		relations: [
			{
				field: "Feature",
				table: "Feature",
				type: "many-to-one"
			},
			{
				field: "BlastQuery",
				table: "BlastQuery",
				type: "many-to-one"
			}
		],
		relationPaths: {
			project: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				},
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			Project: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				},
				{
					field: "Project",
					table: "Project",
					type: "many-to-one"
				}
			],
			sample: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			Sample: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				}
			],
			assay: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			Assay: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				}
			],
			assayPrep: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				}
			],
			AssayPrep: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "AssayPreps",
					table: "AssayPrep",
					type: "one-to-many"
				}
			],
			library: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				}
			],
			Library: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				}
			],
			analysis: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				}
			],
			Analysis: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				}
			],
			occurrence: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			Occurrence: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				}
			],
			feature: [
				{
					field: "Feature",
					table: "Feature",
					type: "many-to-one"
				}
			],
			Feature: [
				{
					field: "Feature",
					table: "Feature",
					type: "many-to-one"
				}
			],
			assignment: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				}
			],
			Assignment: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Occurrences",
					table: "Occurrence",
					type: "one-to-many"
				},
				{
					field: "Assignment",
					table: "Assignment",
					type: "many-to-one"
				}
			],
			taxonomy: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			Taxonomy: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				}
			],
			taxonomySpotlight: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			TaxonomySpotlight: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "Sample",
					table: "Sample",
					type: "many-to-one"
				},
				{
					field: "Taxonomies",
					table: "Taxonomy",
					type: "many-to-many"
				},
				{
					field: "TaxonomySpotlights",
					table: "TaxonomySpotlight",
					type: "one-to-many"
				}
			],
			tag: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			Tag: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Analyses",
					table: "Analysis",
					type: "one-to-many"
				},
				{
					field: "Tags",
					table: "Tag",
					type: "many-to-many"
				}
			],
			alphaDiversity: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			AlphaDiversity: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversity",
					table: "AlphaDiversity",
					type: "many-to-one"
				}
			],
			alphaDiversityIndex: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			AlphaDiversityIndex: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				},
				{
					field: "Assay",
					table: "Assay",
					type: "many-to-one"
				},
				{
					field: "Libraries",
					table: "Library",
					type: "one-to-many"
				},
				{
					field: "AlphaDiversityIndexes",
					table: "AlphaDiversityIndex",
					type: "one-to-many"
				}
			],
			blastQuery: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				}
			],
			BlastQuery: [
				{
					field: "BlastQuery",
					table: "BlastQuery",
					type: "many-to-one"
				}
			]
		}
	}
} as Record<Uncapitalize<ModelName>, TableMetadataValue>;

export const TableNames = Object.keys(TableMetadata) as Readonly<Uncapitalize<ModelName>[]>;
export const NonDataTableNames = ["taxonomySpotlight","tag","alphaDiversity","alphaDiversityIndex","blastQuery","blastQueryResult"] as const;
type NonDataTable = (typeof NonDataTableNames)[number];
export const DataTableNames = TableNames.filter((t) => !NonDataTableNames.includes(t as NonDataTable)) as Readonly<
	Exclude<Uncapitalize<ModelName>, NonDataTable>[]
>;

//duplicate keys with capitalized model names, mapping them to the same value as uncapitalized keys
//Ex: both project and Project map to the same value
for (const table of TableNames) {
	(TableMetadata as Record<Uncapitalize<ModelName> | ModelName, (typeof TableMetadata)[keyof typeof TableMetadata]>)[
		capitalizeTable(table)
	] = TableMetadata[table];
}

export default TableMetadata as Readonly<Record<Uncapitalize<ModelName> | ModelName, TableMetadataValue>>;
