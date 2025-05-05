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
	TaxonomySchema
} from "@/prisma/generated/zod";
import { Permission, Role } from "./globals";

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
};

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
};

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

export const Roles = ["admin", "moderator", "contributor"];
export const Permissions = ["submit", "manageUsers"];

export const RoleHeirarchy = {
	admin: ["moderator", "contributor", undefined],
	moderator: ["contributor", undefined],
	contributor: []
} as Record<NonNullable<Role>, Array<Role>>;

export const RolePermissions = {
	admin: ["submit", "manageUsers"],
	moderator: ["submit", "manageUsers"],
	contributor: ["submit"]
} as Record<NonNullable<Role>, Array<Permission>>;
