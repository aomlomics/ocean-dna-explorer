import * as PrismaZodTypes from "@/prisma/generated/zod";
import { ZodEnum, ZodObject } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import { uncapitalizeTable } from "@/app/helpers/utils";

export type RelationMetadata = {
	field: string;
	table: Prisma.ModelName;
	type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
};

const TableMetadata = {
	project: {
		plural: "Projects",
		description: "A collection of samples, assays, and analyses that are part of a single study.",
		schema: PrismaZodTypes.ProjectSchema,
		enumSchema: PrismaZodTypes.ProjectScalarFieldEnumSchema,
		titleField: "project_id",
		subFields: ["project_name", "study_factor", "institution", "project_contact"],
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
		description: "A sample of environmental material, such as water or soil, that has been collected for analysis.",
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
		description: "The preparation of a sample for a specific assay, including the extraction and amplification of DNA.",
		schema: PrismaZodTypes.AssayPrepSchema,
		enumSchema: PrismaZodTypes.AssayPrepScalarFieldEnumSchema,
		titleField: ["project_id", "assay_name"]
	},
	library: {
		plural: "Libraries",
		description: "A collection of DNA fragments that have been prepared for sequencing.",
		schema: PrismaZodTypes.LibrarySchema,
		enumSchema: PrismaZodTypes.LibraryScalarFieldEnumSchema,
		titleField: "lib_id",
		subFields: ["samp_name", "seq_run_id"]
	},
	analysis: {
		plural: "Analyses",
		description: "The processing of sequencing data to identify and quantify the organisms present in a sample.",
		schema: PrismaZodTypes.AnalysisSchema,
		enumSchema: PrismaZodTypes.AnalysisScalarFieldEnumSchema,
		titleField: "analysis_run_name",
		subFields: ["assay_name", "project_id"]
	},
	occurrence: {
		plural: "Occurrences",
		description: "The presence of a specific organism in a sample, as determined by the analysis of sequencing data.",
		schema: PrismaZodTypes.OccurrenceSchema,
		enumSchema: PrismaZodTypes.OccurrenceScalarFieldEnumSchema,
		titleField: ["analysis_run_name", "samp_name", "featureid"],
		subFields: ["organismQuantity"]
	},
	feature: {
		plural: "Features",
		description: "A unique DNA sequence that has been identified in a sample.",
		schema: PrismaZodTypes.FeatureSchema,
		enumSchema: PrismaZodTypes.FeatureScalarFieldEnumSchema,
		titleField: "featureid",
		subFields: ["dna_sequence", "sequenceLength_ODE"]
	},
	assignment: {
		plural: "Assignments",
		description: "The taxonomic assignment of a feature to a specific organism.",
		schema: PrismaZodTypes.AssignmentSchema,
		enumSchema: PrismaZodTypes.AssignmentScalarFieldEnumSchema,
		titleField: ["analysis_run_name", "featureid"],
		subFields: ["taxonomy", "Confidence"]
	},
	taxonomy: {
		plural: "Taxonomies",
		description: "The scientific classification of organisms into a hierarchical system.",
		schema: PrismaZodTypes.TaxonomySchema,
		enumSchema: PrismaZodTypes.TaxonomyScalarFieldEnumSchema,
		titleField: "taxonomy",
		subFields: [
			"domain",
			"kingdom",
			"supergroup",
			"division",
			"subdivision",
			"phylum",
			"class",
			"order",
			"family",
			"genus",
			"species"
		]
	}
} as Record<
	Uncapitalize<Prisma.ModelName>,
	{
		plural: string;
		description: string;
		schema: ZodObject<Record<string, any>>;
		enumSchema: ZodEnum<Record<string, string>>;
		relations?: RelationMetadata[];
		relationFields?: Record<string, Uncapitalize<Prisma.ModelName>>;
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

	TableMetadata[table].relationFields = relations[table].reduce((acc, rel) => {
		const uncapsRel = rel.slice(0, 1).toLowerCase() + rel.slice(1);
		if (uncapsRel in relations) {
			const relTable = uncapsRel as Uncapitalize<Prisma.ModelName>;
			if (typeof TableMetadata[relTable].titleField === "string") {
				acc[TableMetadata[relTable].titleField] = relTable;
			} else {
				acc[TableMetadata[relTable].titleField.join("/")] = relTable;
			}
		}

		return acc;
	}, {} as Record<string, Uncapitalize<Prisma.ModelName>>);
}

export const TableNames = Object.keys(TableMetadata) as Uncapitalize<Prisma.ModelName>[];

//duplicates keys with capitalized model names, mapping them to the same value as uncapitalized keys
//Ex: both project and Project map to the same value
for (const model of Object.keys(Prisma.ModelName)) {
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
		relationFields: Record<string, Uncapitalize<Prisma.ModelName>>;
		titleField: string | string[];
		subFields?: string[];
		fieldOrder?: string[];
	}
>;
