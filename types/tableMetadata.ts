import * as PrismaZodTypes from "@/prisma/generated/zod";
import { ZodEnum, ZodObject } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import { uncapitalizeTable } from "@/app/helpers/utils";
import { TaxonomicRanks } from "./objects";

export type RelationMetadata = {
	field: string;
	table: Prisma.ModelName;
	type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
};

const TableMetadata = {
	project: {
		plural: "Projects",
		description:
			"Research initiatives collecting eDNA samples, with metadata on study design, objectives, and participating institutions.",
		schema: PrismaZodTypes.ProjectSchema,
		enumSchema: PrismaZodTypes.ProjectScalarFieldEnumSchema,
		titleField: "project_id",
		subFields: ["project_name", "study_factor", "institution", "project_contact", "sample_type"],
		fieldOrder: [
			"project_name",
			"project_contact",
			"institution",
			"institutionID",
			"recordedBy",
			"recordedByID",
			"study_factor",
			"assay_type"
		]
	},
	sample: {
		plural: "Samples",
		description:
			"A sample of environmental material, such as water or soil, that has been collected for analysis with metadata on collection, environmental conditions, storage, and processing methods.",
		schema: PrismaZodTypes.SampleSchema,
		enumSchema: PrismaZodTypes.SampleScalarFieldEnumSchema,
		titleField: "samp_name",
		subFields: ["project_id", "geo_loc_name"],
		fieldOrder: [
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
		]
	},
	assay: {
		plural: "Assays",
		description:
			"The molecular targets, primer sequences, primer references, and expected amplicon size for a specific molecular analysis.",
		schema: PrismaZodTypes.AssaySchema,
		enumSchema: PrismaZodTypes.AssayScalarFieldEnumSchema,
		titleField: "assay_name",
		subFields: ["pcr_primer_name_forward", "pcr_primer_forward", "pcr_primer_name_reverse", "pcr_primer_reverse"]
	},
	assayPrep: {
		plural: "AssayPreps",
		description:
			"The protocol-specific details describing the laboratory procedures used to perform an assay, such as the chemicals, instruments, and conditions employed for sample processing and sequencing.",
		schema: PrismaZodTypes.AssayPrepSchema,
		enumSchema: PrismaZodTypes.AssayPrepScalarFieldEnumSchema,
		titleField: ["project_id", "assay_name"],
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
		]
	},
	library: {
		plural: "Libraries",
		description:
			"A collection of sequencing library molecular preparation details (PCR amplification and indexing), the sequencing instrumentation and run parameters, and metadata for the generated DNA sequence files.",
		schema: PrismaZodTypes.LibrarySchema,
		enumSchema: PrismaZodTypes.LibraryScalarFieldEnumSchema,
		titleField: "lib_id",
		subFields: ["samp_name", "seq_run_id"],
		fieldOrder: [
			"seq_run_id",
			"platform",
			"instrument",
			"seq_kit",
			"lib_layout",
			"input_read_count",
			"lib_conc",
			"lib_conc_unit",
			"phix_perc"
		]
	},
	analysis: {
		plural: "Analyses",
		description:
			"Bioinformatic processing runs that convert raw sequence data into Occurrences (counts) of Features (DNA sequences), documenting all parameters and methods used.",
		schema: PrismaZodTypes.AnalysisSchema,
		enumSchema: PrismaZodTypes.AnalysisScalarFieldEnumSchema,
		titleField: "analysis_run_name",
		subFields: ["assay_name", "project_id", "trusted"]
	},
	occurrence: {
		plural: "Occurrences",
		description:
			"Individual detection records linking samples to specific Features (DNA sequences), including their quantified abundance as determined by the analysis of sequencing data.",
		schema: PrismaZodTypes.OccurrenceSchema,
		enumSchema: PrismaZodTypes.OccurrenceScalarFieldEnumSchema,
		titleField: ["analysis_run_name", "lib_id", "featureid"],
		subFields: ["organismQuantity", "analysis_run_name", "lib_id", "featureid"],
		fieldOrder: ["analysis_run_name", "lib_id", "featureid"]
	},
	assignment: {
		plural: "Assignments",
		description:
			"Taxonomic assignments for each Feature (DNA sequence) to a specific organism, including the confidence of the assignment.",
		schema: PrismaZodTypes.AssignmentSchema,
		enumSchema: PrismaZodTypes.AssignmentScalarFieldEnumSchema,
		titleField: ["analysis_run_name", "featureid"],
		subFields: ["taxonomy", "Confidence"]
	},
	feature: {
		plural: "Features",
		description:
			"Unique DNA sequences (eg, ASVs) found in samples, typically representing distinct organisms, with their taxonomic classifications.",
		schema: PrismaZodTypes.FeatureSchema,
		enumSchema: PrismaZodTypes.FeatureScalarFieldEnumSchema,
		titleField: "featureid",
		subFields: ["dna_sequence", "sequenceLength_ODE"]
	},
	taxonomy: {
		plural: "Taxonomies",
		description: "The scientific classification of organisms into a hierarchical system.",
		schema: PrismaZodTypes.TaxonomySchema,
		enumSchema: PrismaZodTypes.TaxonomyScalarFieldEnumSchema,
		titleField: "taxonomy",
		subFields: TaxonomicRanks
	},
	tag: {
		plural: "Tags",
		description: "",
		schema: PrismaZodTypes.TagSchema,
		enumSchema: PrismaZodTypes.TagScalarFieldEnumSchema,
		titleField: "tagName"
	},
	alphaDiversity: {
		plural: "AlphaDiversities",
		description: "",
		schema: PrismaZodTypes.AlphaDiversitySchema,
		enumSchema: PrismaZodTypes.AlphaDiversityScalarFieldEnumSchema,
		titleField: "id"
	},
	alphaDiversityIndex: {
		plural: "AlphaDiversityIndexes",
		description: "",
		schema: PrismaZodTypes.AlphaDiversityIndexSchema,
		enumSchema: PrismaZodTypes.AlphaDiversityIndexScalarFieldEnumSchema,
		titleField: "id"
	}
} as Record<
	Uncapitalize<Prisma.ModelName>,
	{
		plural: string;
		description: string;
		schema: ZodObject<Record<string, any>>;
		enumSchema: ZodEnum<Record<string, string>>;
		relations?: RelationMetadata[];
		titleField: string | string[];
		subFields?: string[];
		fieldOrder?: string[];
	}
>;

//TODO: type ZodObject properly
function getRelations(fields: string[], relationsSchema: any) {
	const fieldsSet = new Set(fields);
	return Object.keys(relationsSchema.def.shape).filter((f) => !fieldsSet.has(f));
}
const relations = {
	project: getRelations(PrismaZodTypes.ProjectScalarFieldEnumSchema.options, PrismaZodTypes.ProjectWithRelationsSchema),
	sample: getRelations(PrismaZodTypes.SampleScalarFieldEnumSchema.options, PrismaZodTypes.SampleWithRelationsSchema),
	assay: getRelations(PrismaZodTypes.AssayScalarFieldEnumSchema.options, PrismaZodTypes.AssayWithRelationsSchema),
	assayPrep: getRelations(
		PrismaZodTypes.AssayPrepScalarFieldEnumSchema.options,
		PrismaZodTypes.AssayPrepWithRelationsSchema
	),
	library: getRelations(PrismaZodTypes.LibraryScalarFieldEnumSchema.options, PrismaZodTypes.LibraryWithRelationsSchema),
	analysis: getRelations(
		PrismaZodTypes.AnalysisScalarFieldEnumSchema.options,
		PrismaZodTypes.AnalysisWithRelationsSchema
	),
	occurrence: getRelations(
		PrismaZodTypes.OccurrenceScalarFieldEnumSchema.options,
		PrismaZodTypes.OccurrenceWithRelationsSchema
	),
	feature: getRelations(PrismaZodTypes.FeatureScalarFieldEnumSchema.options, PrismaZodTypes.FeatureWithRelationsSchema),
	assignment: getRelations(
		PrismaZodTypes.AssignmentScalarFieldEnumSchema.options,
		PrismaZodTypes.AssignmentWithRelationsSchema
	),
	taxonomy: getRelations(
		PrismaZodTypes.TaxonomyScalarFieldEnumSchema.options,
		PrismaZodTypes.TaxonomyWithRelationsSchema
	),
	tag: getRelations(PrismaZodTypes.TagScalarFieldEnumSchema.options, PrismaZodTypes.TagWithRelationsSchema),
	alphaDiversity: getRelations(
		PrismaZodTypes.AlphaDiversityScalarFieldEnumSchema.options,
		PrismaZodTypes.AlphaDiversityWithRelationsSchema
	),
	alphaDiversityIndex: getRelations(
		PrismaZodTypes.AlphaDiversityIndexScalarFieldEnumSchema.options,
		PrismaZodTypes.AlphaDiversityIndexWithRelationsSchema
	)
} as Record<Uncapitalize<Prisma.ModelName>, string[]>;

for (let e in TableMetadata) {
	const table = e as Uncapitalize<Prisma.ModelName>;

	TableMetadata[table].relations = relations[table].map((rel) => {
		let type = "" as "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
		let relationTable = "" as Prisma.ModelName;

		//self
		if (rel.slice(0, 1).toLowerCase() + rel.slice(1) in relations) {
			//singular
			const lowercaseRelation = uncapitalizeTable(rel as Prisma.ModelName);
			relationTable = rel as Prisma.ModelName;

			//other
			if (relations[lowercaseRelation].some((f) => f.slice(0, 1).toLowerCase() + f.slice(1) === table)) {
				//singular
				type = "one-to-one";
			} else {
				//plural
				type = "many-to-one";
			}
		} else {
			//plural
			const lowercaseRelation = Object.entries(TableMetadata).find(
				(e) => e[1].plural === rel
			)![0] as Uncapitalize<Prisma.ModelName>;
			relationTable = (lowercaseRelation.slice(0, 1).toUpperCase() + lowercaseRelation.slice(1)) as Prisma.ModelName;

			//other
			if (relations[lowercaseRelation].some((t) => t.slice(0, 1).toLowerCase() + t.slice(1) === table)) {
				//singular
				type = "one-to-many";
			} else {
				//plural
				type = "many-to-many";
			}
		}

		return { field: rel, table: relationTable, type };
	});
}

export const TableNames = Object.keys(TableMetadata) as Uncapitalize<Prisma.ModelName>[];
export const DataTableNames = TableNames.filter(
	(t) => t !== "tag" && t !== "alphaDiversity" && t !== "alphaDiversityIndex"
) as Exclude<Uncapitalize<Prisma.ModelName>, "tag" | "alphaDiversity" | "alphaDiversityIndex">[];

//duplicates keys with capitalized model names, mapping them to the same value as uncapitalized keys
//Ex: both project and Project map to the same value
for (const model in Prisma.ModelName) {
	(TableMetadata as any)[model] = TableMetadata[uncapitalizeTable(model as Prisma.ModelName)];
}

export default TableMetadata as Record<
	Uncapitalize<Prisma.ModelName> | Prisma.ModelName,
	{
		plural: string;
		description: string;
		schema: ZodObject<Record<string, any>>;
		enumSchema: ZodEnum<Record<string, string>>;
		relations: RelationMetadata[];
		titleField: string | string[];
		subFields?: string[];
		fieldOrder?: string[];
	}
>;
