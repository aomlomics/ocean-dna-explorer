import { z } from 'zod';
import type { Prisma } from '@/app/generated/prismaImages/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const ImageScalarFieldEnumSchema = z.enum(['id','dateSubmitted','name','url','attributionTitle','description','location','dateTaken']);

export const AttributionScalarFieldEnumSchema = z.enum(['id','attributionTitle','attributionNames','attributionUrl','attributionInstitute']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);
/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// IMAGE SCHEMA
/////////////////////////////////////////

export const ImageSchema = z.object({
  id: z.number().int(),
  dateSubmitted: z.coerce.date(),
  name: z.string(),
  url: z.string(),
  attributionTitle: z.string().nullish(),
  description: z.string().nullish(),
  location: z.string().nullish(),
  dateTaken: z.coerce.date().nullish(),
})

export type Image = z.infer<typeof ImageSchema>

/////////////////////////////////////////
// IMAGE PARTIAL SCHEMA
/////////////////////////////////////////

export const ImagePartialSchema = ImageSchema.partial()

export type ImagePartial = z.infer<typeof ImagePartialSchema>

// IMAGE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const ImageOptionalDefaultsSchema = ImageSchema.merge(z.object({
  id: z.number().int().optional(),
  dateSubmitted: z.coerce.date().optional(),
}))

export type ImageOptionalDefaults = z.infer<typeof ImageOptionalDefaultsSchema>

// IMAGE RELATION SCHEMA
//------------------------------------------------------

export type ImageRelations = {
  Attribution?: AttributionWithRelations | null;
};

export type ImageWithRelations = z.infer<typeof ImageSchema> & ImageRelations

export const ImageWithRelationsSchema: z.ZodType<ImageWithRelations> = ImageSchema.merge(z.object({
  Attribution: z.lazy(() => AttributionWithRelationsSchema).nullish(),
}))

// IMAGE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type ImageOptionalDefaultsRelations = {
  Attribution?: AttributionOptionalDefaultsWithRelations | null;
};

export type ImageOptionalDefaultsWithRelations = z.infer<typeof ImageOptionalDefaultsSchema> & ImageOptionalDefaultsRelations

export const ImageOptionalDefaultsWithRelationsSchema: z.ZodType<ImageOptionalDefaultsWithRelations> = ImageOptionalDefaultsSchema.merge(z.object({
  Attribution: z.lazy(() => AttributionOptionalDefaultsWithRelationsSchema).nullish(),
}))

// IMAGE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type ImagePartialRelations = {
  Attribution?: AttributionPartialWithRelations | null;
};

export type ImagePartialWithRelations = z.infer<typeof ImagePartialSchema> & ImagePartialRelations

export const ImagePartialWithRelationsSchema: z.ZodType<ImagePartialWithRelations> = ImagePartialSchema.merge(z.object({
  Attribution: z.lazy(() => AttributionPartialWithRelationsSchema).nullish(),
})).partial()

export type ImageOptionalDefaultsWithPartialRelations = z.infer<typeof ImageOptionalDefaultsSchema> & ImagePartialRelations

export const ImageOptionalDefaultsWithPartialRelationsSchema: z.ZodType<ImageOptionalDefaultsWithPartialRelations> = ImageOptionalDefaultsSchema.merge(z.object({
  Attribution: z.lazy(() => AttributionPartialWithRelationsSchema).nullish(),
}).partial())

export type ImageWithPartialRelations = z.infer<typeof ImageSchema> & ImagePartialRelations

export const ImageWithPartialRelationsSchema: z.ZodType<ImageWithPartialRelations> = ImageSchema.merge(z.object({
  Attribution: z.lazy(() => AttributionPartialWithRelationsSchema).nullish(),
}).partial())

/////////////////////////////////////////
// ATTRIBUTION SCHEMA
/////////////////////////////////////////

export const AttributionSchema = z.object({
  id: z.number().int(),
  attributionTitle: z.string(),
  attributionNames: z.string().array(),
  attributionUrl: z.string().nullish(),
  attributionInstitute: z.string().nullish(),
})

export type Attribution = z.infer<typeof AttributionSchema>

/////////////////////////////////////////
// ATTRIBUTION PARTIAL SCHEMA
/////////////////////////////////////////

export const AttributionPartialSchema = AttributionSchema.partial()

export type AttributionPartial = z.infer<typeof AttributionPartialSchema>

// ATTRIBUTION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const AttributionOptionalDefaultsSchema = AttributionSchema.merge(z.object({
  id: z.number().int().optional(),
  attributionNames: z.string().array().optional(),
}))

export type AttributionOptionalDefaults = z.infer<typeof AttributionOptionalDefaultsSchema>

// ATTRIBUTION RELATION SCHEMA
//------------------------------------------------------

export type AttributionRelations = {
  Image: ImageWithRelations[];
};

export type AttributionWithRelations = z.infer<typeof AttributionSchema> & AttributionRelations

export const AttributionWithRelationsSchema: z.ZodType<AttributionWithRelations> = AttributionSchema.merge(z.object({
  Image: z.lazy(() => ImageWithRelationsSchema).array(),
}))

// ATTRIBUTION OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type AttributionOptionalDefaultsRelations = {
  Image: ImageOptionalDefaultsWithRelations[];
};

export type AttributionOptionalDefaultsWithRelations = z.infer<typeof AttributionOptionalDefaultsSchema> & AttributionOptionalDefaultsRelations

export const AttributionOptionalDefaultsWithRelationsSchema: z.ZodType<AttributionOptionalDefaultsWithRelations> = AttributionOptionalDefaultsSchema.merge(z.object({
  Image: z.lazy(() => ImageOptionalDefaultsWithRelationsSchema).array(),
}))

// ATTRIBUTION PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type AttributionPartialRelations = {
  Image?: ImagePartialWithRelations[];
};

export type AttributionPartialWithRelations = z.infer<typeof AttributionPartialSchema> & AttributionPartialRelations

export const AttributionPartialWithRelationsSchema: z.ZodType<AttributionPartialWithRelations> = AttributionPartialSchema.merge(z.object({
  Image: z.lazy(() => ImagePartialWithRelationsSchema).array(),
})).partial()

export type AttributionOptionalDefaultsWithPartialRelations = z.infer<typeof AttributionOptionalDefaultsSchema> & AttributionPartialRelations

export const AttributionOptionalDefaultsWithPartialRelationsSchema: z.ZodType<AttributionOptionalDefaultsWithPartialRelations> = AttributionOptionalDefaultsSchema.merge(z.object({
  Image: z.lazy(() => ImagePartialWithRelationsSchema).array(),
}).partial())

export type AttributionWithPartialRelations = z.infer<typeof AttributionSchema> & AttributionPartialRelations

export const AttributionWithPartialRelationsSchema: z.ZodType<AttributionWithPartialRelations> = AttributionSchema.merge(z.object({
  Image: z.lazy(() => ImagePartialWithRelationsSchema).array(),
}).partial())
