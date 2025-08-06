import * as PrismaZodTypes from "@/prisma/generated/zod";
import { ZodEnum } from "zod";
import { Prisma } from "@/app/generated/prisma/client";

export type RelationMetadata = {
	field: string;
	table: Prisma.ModelName;
	type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
};

const TableMetadata = {
	project: {
		schema: PrismaZodTypes.ProjectSchema,
		enumSchema: PrismaZodTypes.ProjectScalarFieldEnumSchema,
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
		titleField: "project_id",
		subFields: ["project_name", "study_factor", "institution", "project_contact"],
		relations: [],
		relationFields: {},
		plural: "Projects"
	},
	sample: {
		schema: PrismaZodTypes.SampleSchema,
		enumSchema: PrismaZodTypes.SampleScalarFieldEnumSchema,
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
		],
		titleField: "samp_name",
		subFields: ["project_id", "geo_loc_name"],
		relations: [],
		relationFields: {},
		plural: "Samples"
	},
	primer: {
		schema: PrismaZodTypes.PrimerSchema,
		enumSchema: PrismaZodTypes.PrimerScalarFieldEnumSchema,
		titleField: ["pcr_primer_name_forward", "pcr_primer_name_reverse"],
		subFields: ["pcr_primer_forward", "pcr_primer_reverse"],
		relations: [],
		relationFields: {},
		plural: "Primers"
	},
	assay: {
		schema: PrismaZodTypes.AssaySchema,
		enumSchema: PrismaZodTypes.AssayScalarFieldEnumSchema,
		titleField: "assay_name",
		subFields: ["pcr_primer_forward", "pcr_primer_reverse"],
		relations: [],
		relationFields: {},
		plural: "Assays"
	},
	library: {
		schema: PrismaZodTypes.LibrarySchema,
		enumSchema: PrismaZodTypes.LibraryScalarFieldEnumSchema,
		titleField: "lib_id",
		subFields: ["samp_name", "seq_run_id"],
		relations: [],
		relationFields: {},
		plural: "Libraries"
	},
	analysis: {
		schema: PrismaZodTypes.AnalysisSchema,
		enumSchema: PrismaZodTypes.AnalysisScalarFieldEnumSchema,
		titleField: "analysis_run_name",
		subFields: ["assay_name", "project_id"],
		relations: [],
		relationFields: {},
		plural: "Analyses"
	},
	occurrence: {
		schema: PrismaZodTypes.OccurrenceSchema,
		enumSchema: PrismaZodTypes.OccurrenceScalarFieldEnumSchema,
		titleField: ["analysis_run_name", "samp_name", "featureid"],
		subFields: ["organismQuantity"],
		relations: [],
		relationFields: {},
		plural: "Occurrences"
	},
	feature: {
		schema: PrismaZodTypes.FeatureSchema,
		enumSchema: PrismaZodTypes.FeatureScalarFieldEnumSchema,
		titleField: "featureid",
		subFields: ["dna_sequence", "sequenceLength_ODE"],
		relations: [],
		relationFields: {},
		plural: "Features"
	},
	assignment: {
		schema: PrismaZodTypes.AssignmentSchema,
		enumSchema: PrismaZodTypes.AssignmentScalarFieldEnumSchema,
		titleField: ["analysis_run_name", "featureid"],
		subFields: ["taxonomy", "Confidence"],
		relations: [],
		relationFields: {},
		plural: "Assignments"
	},
	taxonomy: {
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
		],
		relations: [],
		relationFields: {},
		plural: "Taxonomies"
	}
} as Record<
	Uncapitalize<Prisma.ModelName>,
	{
		schema: any;
		enumSchema: ZodEnum<[string, ...string[]]>;
		fieldOrder?: string[];
		titleField: string | string[];
		subFields?: string[];
		relations: RelationMetadata[];
		relationFields: Record<string, Lowercase<Prisma.ModelName>>;
		plural: string;
	}
>;

//TODO: type ZodObject properly
function getRelations(fieldsEnumSchema: ZodEnum<[string, ...string[]]>, relationsSchema: any) {
	const fields = new Set(Object.values(fieldsEnumSchema._def.values));
	return Object.keys(relationsSchema._def.shape()).filter((f) => !fields.has(f));
}
const relations = {
	project: getRelations(PrismaZodTypes.ProjectScalarFieldEnumSchema, PrismaZodTypes.ProjectWithRelationsSchema),
	sample: getRelations(PrismaZodTypes.SampleScalarFieldEnumSchema, PrismaZodTypes.SampleWithRelationsSchema),
	primer: getRelations(PrismaZodTypes.PrimerScalarFieldEnumSchema, PrismaZodTypes.PrimerWithRelationsSchema),
	assay: getRelations(PrismaZodTypes.AssayScalarFieldEnumSchema, PrismaZodTypes.AssayWithRelationsSchema),
	library: getRelations(PrismaZodTypes.LibraryScalarFieldEnumSchema, PrismaZodTypes.LibraryWithRelationsSchema),
	analysis: getRelations(PrismaZodTypes.AnalysisScalarFieldEnumSchema, PrismaZodTypes.AnalysisWithRelationsSchema),
	occurrence: getRelations(
		PrismaZodTypes.OccurrenceScalarFieldEnumSchema,
		PrismaZodTypes.OccurrenceWithRelationsSchema
	),
	feature: getRelations(PrismaZodTypes.FeatureScalarFieldEnumSchema, PrismaZodTypes.FeatureWithRelationsSchema),
	assignment: getRelations(
		PrismaZodTypes.AssignmentScalarFieldEnumSchema,
		PrismaZodTypes.AssignmentWithRelationsSchema
	),
	taxonomy: getRelations(PrismaZodTypes.TaxonomyScalarFieldEnumSchema, PrismaZodTypes.TaxonomyWithRelationsSchema)
} as Record<Uncapitalize<Prisma.ModelName>, string[]>;

for (let e in TableMetadata) {
	const table = e as Uncapitalize<Prisma.ModelName>;

	TableMetadata[table].relations = relations[table].map((rel) => {
		let type = "" as "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
		let relationTable = "" as Prisma.ModelName;

		//self
		if (rel.toLowerCase() in relations) {
			//singular
			const lowercaseRelation = rel.toLowerCase() as Uncapitalize<Prisma.ModelName>;
			relationTable = rel as Prisma.ModelName;

			//other
			if (relations[lowercaseRelation].some((f) => f.toLowerCase() === table)) {
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
			if (relations[lowercaseRelation].some((t) => t.toLowerCase() === table)) {
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
		const relTable = rel.toLowerCase() as Lowercase<Prisma.ModelName>;
		if (relTable in relations) {
			if (typeof TableMetadata[relTable].titleField === "string") {
				acc[TableMetadata[relTable].titleField] = relTable;
			} else {
				acc[TableMetadata[relTable].titleField.join("/")] = relTable;
			}
		}

		return acc;
	}, {} as Record<string, Lowercase<Prisma.ModelName>>);
}

export default TableMetadata;
