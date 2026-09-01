import * as PrismaZodTypes from "@/prisma/generated/zod";
import type { ZodEnum, ZodObject, ZodType } from "zod";
import type { Prisma } from "@/app/generated/prisma/browser";
import type {
	AnalysisModel,
	AssayModel,
	AssayPrepModel,
	AssignmentModel,
	FeatureModel,
	LibraryModel,
	OccurrenceModel,
	ProjectModel,
	SampleModel,
	TaxonomyModel
} from "@/app/generated/prisma/models";
import { capitalizeTable, uncapitalizeTable } from "@/app/helpers/utils";
import { TaxonomicRanks } from "./objects";

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
		description:
			"Research initiatives collecting eDNA samples, with metadata on study design, objectives, and participating institutions.",
		schema: PrismaZodTypes.ProjectSchema,
		enumSchema: PrismaZodTypes.ProjectScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.ProjectWithRelationsSchema,
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
		]
	},
	sample: {
		plural: "Samples",
		description:
			"Environmental material samples, such as water or soil, collected for analysis with metadata on collection, environmental conditions, storage, and processing methods.",
		schema: PrismaZodTypes.SampleSchema,
		enumSchema: PrismaZodTypes.SampleScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.SampleWithRelationsSchema,
		titleField: ["project_id", "samp_name"],
		subFields: ["Libraries", "Taxonomies", "geo_loc_name"],
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
		]
	},
	assay: {
		plural: "Assays",
		description:
			"Molecular targets, primer sequences, primer references, and expected amplicon sizes for specific molecular analyses.",
		schema: PrismaZodTypes.AssaySchema,
		enumSchema: PrismaZodTypes.AssayScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.AssayWithRelationsSchema,
		titleField: "assay_name",
		subFields: [
			"Analyses",
			"pcr_primer_name_forward",
			"pcr_primer_forward",
			"pcr_primer_name_reverse",
			"pcr_primer_reverse"
		]
	},
	assayPrep: {
		plural: "AssayPreps",
		description:
			"Protocol-specific details describing the laboratory procedures used to perform an assay, such as the chemicals, instruments, and conditions employed for sample processing and sequencing.",
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
			"Collections of sequencing library molecular preparation details (PCR amplification and indexing), the sequencing instrumentation and run parameters, and metadata for the generated DNA sequence files.",
		schema: PrismaZodTypes.LibrarySchema,
		enumSchema: PrismaZodTypes.LibraryScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.LibraryWithRelationsSchema,
		titleField: ["project_id", "lib_id"],
		subFields: ["Sample", "seq_run_id"],
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
		]
	},
	analysis: {
		plural: "Analyses",
		description:
			"Bioinformatic processing runs that convert raw sequence data into Occurrences (counts) of Features (DNA sequences), documenting all parameters and methods used.",
		schema: PrismaZodTypes.AnalysisSchema,
		enumSchema: PrismaZodTypes.AnalysisScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.AnalysisWithRelationsSchema,
		titleField: ["project_id", "analysis_run_name"],
		subFields: ["assay_name", "Features", "Taxonomies", "trusted"]
	},
	occurrence: {
		plural: "Occurrences",
		description:
			"Individual detection records linking samples to specific Features (DNA sequences), including their quantified abundance as determined by the analysis of sequencing data.",
		schema: PrismaZodTypes.OccurrenceSchema,
		enumSchema: PrismaZodTypes.OccurrenceScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.OccurrenceWithRelationsSchema,
		titleField: ["project_id", "analysis_run_name", "lib_id", "featureid"],
		subFields: ["Analysis", "Library", "Assignment", "organismQuantity"]
	},
	assignment: {
		plural: "Assignments",
		description:
			"Taxonomic assignments for each Feature (DNA sequence) to a specific organism, including the confidence of the assignment.",
		schema: PrismaZodTypes.AssignmentSchema,
		enumSchema: PrismaZodTypes.AssignmentScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.AssignmentWithRelationsSchema,
		titleField: ["project_id", "analysis_run_name", "featureid"],
		subFields: ["Analysis", "taxonomy", "Confidence"]
	},
	feature: {
		plural: "Features",
		description:
			"Unique DNA sequences (e.g., ASVs) found in samples, typically representing distinct organisms, with their taxonomic classifications.",
		schema: PrismaZodTypes.FeatureSchema,
		enumSchema: PrismaZodTypes.FeatureScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.FeatureWithRelationsSchema,
		titleField: "featureid",
		subFields: ["Analyses", "dna_sequence", "sequenceLength_ODE"]
	},
	taxonomy: {
		plural: "Taxonomies",
		description: "The scientific classification of organisms into a hierarchical system.",
		schema: PrismaZodTypes.TaxonomySchema,
		enumSchema: PrismaZodTypes.TaxonomyScalarFieldEnumSchema,
		relationsSchema: PrismaZodTypes.TaxonomyWithRelationsSchema,
		titleField: "taxonomy",
		subFields: ["Analyses", "Samples", ...TaxonomicRanks]
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
		fieldOrder: [
			"percentIdentity",
			"eValue",
			"alignmentLength",
			"bitScore",
			"mismatches",
			"queryStart",
			"gapOpens",
			"subjectStart"
		]
	}
} as Record<
	Uncapitalize<ModelName>,
	Omit<TableMetadataValue, "relations" | "relationPaths"> & {
		relationsSchema?: ZodType<any>;
		relations?: TableMetadataValue["relations"];
		relationPaths?: TableMetadataValue["relationPaths"];
	}
>;

//table name helpers
export const TableNames = Object.keys(TableMetadata) as Readonly<Uncapitalize<ModelName>[]>;
export const NonDataTableNames = [
	"tag",
	"alphaDiversity",
	"alphaDiversityIndex",
	"blastQuery",
	"blastQueryResult"
] as const;
type NonDataTable = (typeof NonDataTableNames)[number];
export const DataTableNames = TableNames.filter((t) => !NonDataTableNames.includes(t as NonDataTable)) as Readonly<
	Exclude<Uncapitalize<ModelName>, NonDataTable>[]
>;

//assemble relation metadata
function getRelations(fields: string[], relationsSchema: ZodType<any>) {
	const fieldsSet = new Set(fields);
	return Object.keys((relationsSchema as ZodObject<any>).shape).filter((f) => !fieldsSet.has(f));
}
const relations = Object.entries(TableMetadata).reduce(
	(acc, [table, meta]) => ({ ...acc, [table]: getRelations(meta.enumSchema.options, meta.relationsSchema!) }),
	{} as Record<Uncapitalize<ModelName>, string[]>
);

for (const table of TableNames) {
	delete TableMetadata[table].relationsSchema;
	TableMetadata[table].relations = relations[table].map((rel) => {
		let type = "" as "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
		let relationTable = "" as ModelName;

		//self
		if (rel.charAt(0).toLowerCase() + rel.slice(1) in relations) {
			//singular
			const lowercaseRelation = uncapitalizeTable(rel as ModelName);
			relationTable = rel as ModelName;

			//other
			if (relations[lowercaseRelation].some((f) => f.charAt(0).toLowerCase() + f.slice(1) === table)) {
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
			)![0] as Uncapitalize<ModelName>;
			relationTable = capitalizeTable(lowercaseRelation);

			//other
			if (relations[lowercaseRelation].some((t) => t.charAt(0).toLowerCase() + t.slice(1) === table)) {
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

//assemble relational path metadata
function getRelationPath(start: Uncapitalize<ModelName>, target: Uncapitalize<ModelName>) {
	const queue = [[capitalizeTable(start), []]] as [ModelName, ModelName[]][];
	const visited = new Set() as Set<ModelName>;

	const capsTarget = capitalizeTable(target);
	while (queue.length) {
		const [curr, [...path]] = queue.shift()!;
		path.push(curr);

		if (curr === capsTarget) {
			if (!path.length) {
				return;
			}

			//convert to path of relation metadata
			const pathRelations = [] as RelationMetadata[];
			path.reduce((prev, t) => {
				pathRelations.push(TableMetadata[uncapitalizeTable(prev)].relations!.find((rel) => rel.table === t)!);
				return t;
			});
			return pathRelations as [RelationMetadata, ...RelationMetadata[]];
		}

		if (
			!visited.has(curr) && //skip visited tables
			//Project restrictions
			(curr !== "Project" || //base case
				path.length === 1) //starting at Project
		) {
			for (const rel of TableMetadata[uncapitalizeTable(curr)].relations!) {
				if (
					//Analysis restrictions
					(curr !== "Analysis" || //base case
						rel.table === "Project" || //Analysis to Project
						rel.table === "Assay" || //Analysis to Assay
						path.includes("Project") || //Project to Analysis
						path.length === 1) && //starting at Analysis
					//Assay restrictions
					(curr !== "Assay" || //base case
						rel.table === "AssayPrep" || //Assay to AssayPrep
						(path.includes("AssayPrep") && path.length === 2) || //starting at AssayPrep to Assay
						path.length === 1) //starting at Assay
				) {
					queue.push([rel.table, path]);
				}
			}
		}
		visited.add(curr);
	}
}

for (const start of TableNames) {
	const paths = {} as RelationPaths;

	for (const target of TableNames) {
		if (start === target) continue;

		const path = getRelationPath(start, target);

		if (path) {
			paths[target] = path;
			paths[capitalizeTable(target)] = paths[target];
		}
	}

	TableMetadata[start].relationPaths = paths;
}

//duplicate keys with capitalized model names, mapping them to the same value as uncapitalized keys
//Ex: both project and Project map to the same value
for (const table of TableNames) {
	(TableMetadata as Record<Uncapitalize<ModelName> | ModelName, (typeof TableMetadata)[keyof typeof TableMetadata]>)[
		capitalizeTable(table)
	] = TableMetadata[table];
}

export default TableMetadata as Readonly<Record<Uncapitalize<ModelName> | ModelName, TableMetadataValue>>;

export function exploreUrl(
	args: { params?: Record<string, string> | URLSearchParams; hash?: string } & (
		| { table: "project"; project_id: ProjectModel["project_id"] }
		| { table: "sample"; project_id: SampleModel["project_id"]; samp_name: SampleModel["samp_name"] }
		| { table: "assay"; assay_name: AssayModel["assay_name"] }
		| { table: "assayPrep"; project_id: AssayPrepModel["project_id"]; assay_name: AssayPrepModel["assay_name"] }
		| { table: "library"; project_id: LibraryModel["project_id"]; lib_id: LibraryModel["lib_id"] }
		| {
				table: "analysis";
				project_id: AnalysisModel["project_id"];
				analysis_run_name: AnalysisModel["analysis_run_name"];
		  }
		| {
				table: "occurrence";
				project_id: OccurrenceModel["project_id"];
				analysis_run_name: OccurrenceModel["analysis_run_name"];
				lib_id: OccurrenceModel["lib_id"];
				featureid: OccurrenceModel["featureid"];
		  }
		| {
				table: "assignment";
				project_id: AssignmentModel["project_id"];
				analysis_run_name: AssignmentModel["analysis_run_name"];
				featureid: AssignmentModel["featureid"];
		  }
		| { table: "feature"; featureid: FeatureModel["featureid"] }
		| { table: "taxonomy"; taxonomy: TaxonomyModel["taxonomy"] }
	)
) {
	const { table, params, hash, ...titleFieldObj } = args;
	let extra = "";
	if (params) extra += "?" + new URLSearchParams(params);
	if (hash) extra += "#" + hash;

	if (typeof TableMetadata[table].titleField === "string") {
		return `/explore/${table}/${encodeURIComponent(
			titleFieldObj[TableMetadata[table].titleField as keyof typeof titleFieldObj]
		)}${extra}`;
	} else {
		return `/explore/${table}/${TableMetadata[table].titleField
			.map((f) => encodeURIComponent(titleFieldObj[f as keyof typeof titleFieldObj]))
			.join("/")}${extra}`;
	}
}
