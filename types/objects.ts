import {
	ProjectScalarFieldEnumSchema,
	SampleScalarFieldEnumSchema,
	PrimerScalarFieldEnumSchema,
	AssayScalarFieldEnumSchema,
	LibraryScalarFieldEnumSchema,
	AnalysisScalarFieldEnumSchema,
	OccurrenceScalarFieldEnumSchema,
	FeatureScalarFieldEnumSchema,
	AssignmentScalarFieldEnumSchema,
	TaxonomyScalarFieldEnumSchema,
	ProjectSchema,
	SampleSchema,
	PrimerSchema,
	AssaySchema,
	LibrarySchema,
	AnalysisSchema,
	OccurrenceSchema,
	FeatureSchema,
	AssignmentSchema,
	TaxonomySchema,
	ProjectWithRelationsSchema,
	SampleWithRelationsSchema,
	PrimerWithRelationsSchema,
	AssayWithRelationsSchema,
	LibraryWithRelationsSchema,
	AnalysisWithRelationsSchema,
	OccurrenceWithRelationsSchema,
	FeatureWithRelationsSchema,
	AssignmentWithRelationsSchema,
	TaxonomyWithRelationsSchema
} from "@/prisma/generated/zod";
import { Permission, Role } from "./globals";
import { z, ZodEnum } from "zod";
import { Prisma } from "@/app/generated/prisma/client";

export const TableToEnumSchema = {
	project: ProjectScalarFieldEnumSchema,
	sample: SampleScalarFieldEnumSchema,
	primer: PrimerScalarFieldEnumSchema,
	assay: AssayScalarFieldEnumSchema,
	library: LibraryScalarFieldEnumSchema,
	analysis: AnalysisScalarFieldEnumSchema,
	occurrence: OccurrenceScalarFieldEnumSchema,
	feature: FeatureScalarFieldEnumSchema,
	assignment: AssignmentScalarFieldEnumSchema,
	taxonomy: TaxonomyScalarFieldEnumSchema
} as Record<Lowercase<Prisma.ModelName>, ZodEnum<[string, ...string[]]>>;

export const TableToSchema = {
	project: ProjectSchema,
	sample: SampleSchema,
	primer: PrimerSchema,
	assay: AssaySchema,
	library: LibrarySchema,
	analysis: AnalysisSchema,
	occurrence: OccurrenceSchema,
	feature: FeatureSchema,
	assignment: AssignmentSchema,
	taxonomy: TaxonomySchema
} as Record<Lowercase<Prisma.ModelName>, any>; //TODO: type ZodObject properly

//TODO: type ZodObject properly
function schemaToRelations(fieldsEnumSchema: ZodEnum<[string, ...string[]]>, relationsSchema: any) {
	const fields = new Set(Object.values(fieldsEnumSchema._def.values));
	return Object.keys(relationsSchema._def.shape()).filter((f) => !fields.has(f));
}
export const TableToRelations = {
	project: schemaToRelations(ProjectScalarFieldEnumSchema, ProjectWithRelationsSchema),
	sample: schemaToRelations(SampleScalarFieldEnumSchema, SampleWithRelationsSchema),
	primer: schemaToRelations(PrimerScalarFieldEnumSchema, PrimerWithRelationsSchema),
	assay: schemaToRelations(AssayScalarFieldEnumSchema, AssayWithRelationsSchema),
	library: schemaToRelations(LibraryScalarFieldEnumSchema, LibraryWithRelationsSchema),
	analysis: schemaToRelations(AnalysisScalarFieldEnumSchema, AnalysisWithRelationsSchema),
	occurrence: schemaToRelations(OccurrenceScalarFieldEnumSchema, OccurrenceWithRelationsSchema),
	feature: schemaToRelations(FeatureScalarFieldEnumSchema, FeatureWithRelationsSchema),
	assignment: schemaToRelations(AssignmentScalarFieldEnumSchema, AssignmentWithRelationsSchema),
	taxonomy: schemaToRelations(TaxonomyScalarFieldEnumSchema, TaxonomyWithRelationsSchema)
} as Record<Lowercase<Prisma.ModelName>, string[]>;

export const TableDepluralize = {
	projects: "project",
	samples: "sample",
	primers: "primer",
	assays: "assay",
	libraries: "library",
	analyses: "analysis",
	occurrences: "occurrence",
	features: "feature",
	assignments: "assignment",
	taxonomies: "taxonomy"
} as Record<string, Lowercase<Prisma.ModelName>>;

export const EXPLORE_ROUTES = {
	project: "Projects",
	sample: "Samples",
	assay: "Assays",
	// library: {
	// 	name: "Libraries",
	// 	description:
	// 		"Sequencing preparation details for each Sample-Assay combination, including barcoding approach, sequencing platform, and adapter information."
	// },
	analysis: "Analyses",
	// occurrence: {
	// 	name: "Occurrences",
	// 	description:
	// 		"Individual detection records linking samples to specific DNA sequences (Features), including their quantified abundance."
	// },
	feature: "Features",
	// assignment: { name: "Assignments", description: "Some description." },
	taxonomy: "Taxonomies"
};

export const Roles = ["admin", "moderator", "contributor"] as Role[];
export const Permissions = ["contribute", "manageUsers"] as Permission[];

//undefined is a signed in user without a role
export const RoleHeirarchy = {
	admin: ["moderator", "contributor", undefined],
	moderator: ["contributor", undefined],
	contributor: []
} as Record<NonNullable<Role>, Array<Role>>;

export const RolePermissions = {
	admin: ["contribute", "manageUsers"],
	moderator: ["contribute", "manageUsers"],
	contributor: ["contribute"]
} as Record<NonNullable<Role>, Array<Permission>>;

// const MAX_FILE_SIZE = 5000000;
export const EXT_TO_MIME = {
	tsv: "text/tab-separated-values"
};

// export const ZodTableFile = z
// 	.any()
// 	.refine((files) => files?.length == 1, "File is required.")
// 	// .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
// 	.refine(
// 		(files) => Object.values(EXT_TO_MIME).includes(files?.[0]?.type),
// 		Object.keys(EXT_TO_MIME)
// 			.map((type) => type.split("/")[1])
// 			.join(", ") + " files are accepted."
// 	);

//TODO: replace with native zod file validation when zod 4 releases
export const ZodFileSchema = z.custom<File>((data) => {
	return typeof window === "undefined" ? z.any() : data instanceof File;
}, "Data is not a File");
// .refine(
// 	(file) => Object.values(EXT_TO_MIME).includes(file.type),
// 	Object.keys(EXT_TO_MIME)
// 		.map((type) => type.split("/")[1])
// 		.join(", ") + " files are accepted."
// );

export const ZodBooleanSchema = z
	.union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("on")])
	.transform((value) => value === true || value === "true" || value === "on");
