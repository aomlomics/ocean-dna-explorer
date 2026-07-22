import * as PrismaZodTypes from "@/prisma/generated/zod";
import { ZodEnum, ZodObject, ZodType } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import { capitalizeTable, uncapitalizeTable } from "@/app/helpers/utils";
import { TaxonomicRanks } from "./objects";

export type RelationMetadata = Readonly<{
	field: string;
	table: Prisma.ModelName;
	type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
}>;

type Metadata = Readonly<{
	plural: string;
	description: string;
	schema: Readonly<ZodObject<Record<string, any>>>;
	enumSchema: Readonly<ZodEnum<Record<string, string>>>;
	relations: readonly RelationMetadata[];
	titleField: string | readonly string[];
	subFields?: readonly string[];
	fieldOrder?: readonly string[];
}>;

const TableMetadata = {
	project: {
		plural: "Projects",
		description:
			"Research initiatives collecting eDNA samples, with metadata on study design, objectives, and participating institutions.",
		schema: PrismaZodTypes.ProjectSchema,
		enumSchema: PrismaZodTypes.ProjectScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.ProjectWithRelationsSchema,
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
		relationsSchema: PrismaZodTypes.SampleWithRelationsSchema,
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
		relationsSchema: PrismaZodTypes.AssayWithRelationsSchema,
		titleField: "assay_name",
		subFields: ["pcr_primer_name_forward", "pcr_primer_forward", "pcr_primer_name_reverse", "pcr_primer_reverse"]
	},
	assayPrep: {
		plural: "AssayPreps",
		description:
			"The protocol-specific details describing the laboratory procedures used to perform an assay, such as the chemicals, instruments, and conditions employed for sample processing and sequencing.",
		schema: PrismaZodTypes.AssayPrepSchema,
		enumSchema: PrismaZodTypes.AssayPrepScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.AssayPrepWithRelationsSchema,
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
		relationsSchema: PrismaZodTypes.LibraryWithRelationsSchema,
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
		relationsSchema: PrismaZodTypes.AnalysisWithRelationsSchema,
		titleField: "analysis_run_name",
		subFields: ["assay_name", "project_id", "trusted"]
	},
	occurrence: {
		plural: "Occurrences",
		description:
			"Individual detection records linking samples to specific Features (DNA sequences), including their quantified abundance as determined by the analysis of sequencing data.",
		schema: PrismaZodTypes.OccurrenceSchema,
		enumSchema: PrismaZodTypes.OccurrenceScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.OccurrenceWithRelationsSchema,
		titleField: ["analysis_run_name", "lib_id", "featureid"],
		subFields: ["organismQuantity", "analysis_run_name", "featureid"]
	},
	assignment: {
		plural: "Assignments",
		description:
			"Taxonomic assignments for each Feature (DNA sequence) to a specific organism, including the confidence of the assignment.",
		schema: PrismaZodTypes.AssignmentSchema,
		enumSchema: PrismaZodTypes.AssignmentScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.AssignmentWithRelationsSchema,
		titleField: ["analysis_run_name", "featureid"],
		subFields: ["taxonomy", "Confidence"]
	},
	feature: {
		plural: "Features",
		description:
			"Unique DNA sequences (eg, ASVs) found in samples, typically representing distinct organisms, with their taxonomic classifications.",
		schema: PrismaZodTypes.FeatureSchema,
		enumSchema: PrismaZodTypes.FeatureScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.FeatureWithRelationsSchema,
		titleField: "featureid",
		subFields: ["dna_sequence", "sequenceLength_ODE"]
	},
	taxonomy: {
		plural: "Taxonomies",
		description: "The scientific classification of organisms into a hierarchical system.",
		schema: PrismaZodTypes.TaxonomySchema,
		enumSchema: PrismaZodTypes.TaxonomyScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.TaxonomyWithRelationsSchema,
		titleField: "taxonomy",
		subFields: TaxonomicRanks
	},
	tag: {
		plural: "Tags",
		description: "",
		schema: PrismaZodTypes.TagSchema,
		enumSchema: PrismaZodTypes.TagScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.TagWithRelationsSchema,
		titleField: "tagName"
	},
	alphaDiversity: {
		plural: "AlphaDiversities",
		description: "",
		schema: PrismaZodTypes.AlphaDiversitySchema,
		enumSchema: PrismaZodTypes.AlphaDiversityScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.AlphaDiversityWithRelationsSchema,
		titleField: "id"
	},
	alphaDiversityIndex: {
		plural: "AlphaDiversityIndexes",
		description: "",
		schema: PrismaZodTypes.AlphaDiversityIndexSchema,
		enumSchema: PrismaZodTypes.AlphaDiversityIndexScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.AlphaDiversityIndexWithRelationsSchema,
		titleField: "id"
	},
	blastQuery: {
		plural: "BlastQueries",
		description: "",
		schema: PrismaZodTypes.BlastQuerySchema,
		enumSchema: PrismaZodTypes.BlastQueryScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.BlastQueryWithRelationsSchema,
		titleField: "id"
	},
	blastQueryResult: {
		plural: "BlastQueryResults",
		description: "",
		schema: PrismaZodTypes.BlastQueryResultSchema,
		enumSchema: PrismaZodTypes.BlastQueryResultScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.BlastQueryResultWithRelationsSchema,
		titleField: "id",
		fieldOrder: ["featureid", "evalue"]
	}
} as Record<
	Uncapitalize<Prisma.ModelName>,
	Omit<Metadata, "relations"> & { relationsSchema?: ZodType<any>; relations?: Metadata["relations"] }
>;

//table name helpers
export const TableNames = Object.keys(TableMetadata) as Readonly<Uncapitalize<Prisma.ModelName>[]>;
export const NonDataTableNames = [
	"tag",
	"alphaDiversity",
	"alphaDiversityIndex",
	"blastQuery",
	"blastQueryResult"
] as const;
type NonDataTable = (typeof NonDataTableNames)[number];
export const DataTableNames = TableNames.filter((t) => !NonDataTableNames.includes(t as NonDataTable)) as Readonly<
	Exclude<Uncapitalize<Prisma.ModelName>, NonDataTable>[]
>;

//assemble relation metadata
function getRelations(fields: string[], relationsSchema: ZodType<any>) {
	const fieldsSet = new Set(fields);
	return Object.keys((relationsSchema as ZodObject<any>).shape).filter((f) => !fieldsSet.has(f));
}
const relations = Object.entries(TableMetadata).reduce(
	(acc, [table, meta]) => ({ ...acc, [table]: getRelations(meta.enumSchema.options, meta.relationsSchema!) }),
	{} as Record<Uncapitalize<Prisma.ModelName>, string[]>
);

for (let e in TableMetadata) {
	const table = e as Uncapitalize<Prisma.ModelName>;

	delete TableMetadata[table].relationsSchema;
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
			relationTable = capitalizeTable(lowercaseRelation);

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

//duplicate keys with capitalized model names, mapping them to the same value as uncapitalized keys
//Ex: both project and Project map to the same value
for (const model of Object.values(Prisma.ModelName)) {
	(
		TableMetadata as Record<
			Uncapitalize<Prisma.ModelName> | Prisma.ModelName,
			(typeof TableMetadata)[keyof typeof TableMetadata]
		>
	)[model] = TableMetadata[uncapitalizeTable(model)];
}

export default TableMetadata as Readonly<Record<Uncapitalize<Prisma.ModelName> | Prisma.ModelName, Metadata>>;
