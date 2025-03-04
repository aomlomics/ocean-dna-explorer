import {
	AnalysisScalarFieldEnumSchema,
	AnalysisSchema,
	AssayScalarFieldEnumSchema,
	AssaySchema,
	AssignmentScalarFieldEnumSchema,
	AssignmentSchema,
	FeatureScalarFieldEnumSchema,
	FeatureSchema,
	LibraryScalarFieldEnumSchema,
	LibrarySchema,
	OccurrenceOptionalDefaultsSchema,
	OccurrenceScalarFieldEnumSchema,
	OccurrenceSchema,
	ProjectScalarFieldEnumSchema,
	ProjectSchema,
	SampleScalarFieldEnumSchema,
	SampleSchema,
	TaxonomyScalarFieldEnumSchema,
	TaxonomySchema
} from "@/prisma/generated/zod";

export enum DeadValueEnum {
	"not applicable" = -9999,
	"not collected",
	"not provided",
	"missing"
}

export const DeadBooleanEnum = {
	false: "false",
	"0": "false",
	true: "true",
	"1": "true",
	"not applicable": "not_applicable",
	"not collected": "not_collected",
	"not provided": "not_provided",
	missing: "missing"
};

export const TableToEnumSchema = {
	project: ProjectScalarFieldEnumSchema,
	sample: SampleScalarFieldEnumSchema,
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
	assay: AssaySchema,
	library: LibrarySchema,
	analysis: AnalysisSchema,
	occurrence: OccurrenceSchema,
	feature: FeatureSchema,
	assignment: AssignmentSchema,
	taxonomy: TaxonomySchema
};
