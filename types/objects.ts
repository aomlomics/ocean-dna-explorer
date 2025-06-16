import * as PrismaZodTypes from "@/prisma/generated/zod";
import { Permission, Role } from "./globals";
import { z, ZodEnum } from "zod";
import { Prisma, Taxonomy } from "@/app/generated/prisma/client";

export const TableToEnumSchema = {
	project: PrismaZodTypes.ProjectScalarFieldEnumSchema,
	sample: PrismaZodTypes.SampleScalarFieldEnumSchema,
	primer: PrismaZodTypes.PrimerScalarFieldEnumSchema,
	assay: PrismaZodTypes.AssayScalarFieldEnumSchema,
	library: PrismaZodTypes.LibraryScalarFieldEnumSchema,
	analysis: PrismaZodTypes.AnalysisScalarFieldEnumSchema,
	occurrence: PrismaZodTypes.OccurrenceScalarFieldEnumSchema,
	feature: PrismaZodTypes.FeatureScalarFieldEnumSchema,
	assignment: PrismaZodTypes.AssignmentScalarFieldEnumSchema,
	taxonomy: PrismaZodTypes.TaxonomyScalarFieldEnumSchema
} as Record<Lowercase<Prisma.ModelName>, ZodEnum<[string, ...string[]]>>;

export const TableToSchema = {
	project: PrismaZodTypes.ProjectSchema,
	sample: PrismaZodTypes.SampleSchema,
	primer: PrismaZodTypes.PrimerSchema,
	assay: PrismaZodTypes.AssaySchema,
	library: PrismaZodTypes.LibrarySchema,
	analysis: PrismaZodTypes.AnalysisSchema,
	occurrence: PrismaZodTypes.OccurrenceSchema,
	feature: PrismaZodTypes.FeatureSchema,
	assignment: PrismaZodTypes.AssignmentSchema,
	taxonomy: PrismaZodTypes.TaxonomySchema
} as Record<Lowercase<Prisma.ModelName>, any>; //TODO: type ZodObject properly

//TODO: type ZodObject properly
//TODO: display whether relation is -to-one or -to-many
function getRelations(fieldsEnumSchema: ZodEnum<[string, ...string[]]>, relationsSchema: any) {
	const fields = new Set(Object.values(fieldsEnumSchema._def.values));
	return Object.keys(relationsSchema._def.shape()).filter((f) => !fields.has(f));
}
export const TableToRelations = {
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
} as Record<Role, Array<Role>>;

export const RolePermissions = {
	admin: ["contribute", "manageUsers"],
	moderator: ["contribute", "manageUsers"],
	contributor: ["contribute"]
} as Record<Role, Array<Permission>>;

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

export const TaxonomicRanks = [
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
] as Array<keyof Taxonomy>;

export const RanksBySpecificity = TaxonomicRanks.toReversed();

export const GlobalOmit = ["userIds", "isPrivate", "editHistory", "userDefined"];
