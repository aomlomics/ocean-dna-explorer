import { z } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import { JsonValue } from "@prisma/client/runtime/client";

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = JsonValue | null | 'JsonNull' | 'DbNull' | typeof Prisma.NullTypes.DbNull | typeof Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
	if (!v || v === "DbNull") return typeof Prisma.NullTypes.DbNull;
	if (v === "JsonNull") return typeof Prisma.NullTypes.JsonNull;
	return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.string(), z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.any() }),
    z.record(z.string(), z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const AnalysisScalarFieldEnumSchema = z.enum(['id','analysis_run_name','dateSubmitted','isPrivate','trusted','editHistory','project_id','assay_name','analysisMetadataFileUrl_ODE','analysisMetadataFileChecksum_ODE','asvFileUrl_ODE','asvFileChecksum_ODE','occurrenceFileUrl_ODE','occurrenceFileChecksum_ODE','sop_bioinformatics','trim_method','trim_param','demux_tool','demux_max_mismatch','merge_tool','merge_min_overlap','min_len_cutoff','min_len_tool','error_rate_tool','error_rate_type','error_rate_cutoff','chimera_check_method','chimera_check_param','otu_clust_tool','otu_clust_cutoff','min_reads_cutoff','min_reads_cutoff_unit','min_reads_tool','otu_db','otu_db_custom','tax_assign_cat','otu_seq_comp_appr','tax_class_id_cutoff','tax_class_query_cutoff','tax_class_collapse','tax_class_other','screen_contam_method','screen_geograph_method','screen_nontarget_method','screen_other','bioinfo_method_additional','asv_method','dada2_trunc_len_f','dada2pe_trunc_len_r','dada2_trim_left_f','dada2pe_trim_left_r','dada2_max_ee_f','dada2pe_max_ee_r','dada2_trunc_q','dada2_pooling_method','dada2_chimera_method','dada2_min_fold_parent_over_abundance','dada2_n_reads_learn','deblur_trim_length','deblur_mean_error','deblur_indel_prob','deblur_indel_max','deblur_min_reads','deblur_min_size','repseqs_min_length','repseqs_max_length','repseqs_min_abundance','repseqs_min_prevalence','discard_untrimmed','otu_num_tax_assigned','output_otu_num','output_read_count','otu_final_description','otu_raw_description','qiime2_version','tourmaline_asv_method','skl_confidence','min_consensus','tourmaline_classify_method','blca_confidence','percent_match','percent_match_Midpoint_ODE','percent_match_End_ODE','percent_query_cover','percent_query_cover_Midpoint_ODE','percent_query_cover_End_ODE']);

export const RelationLoadStrategySchema = z.enum(['query','join']);

export const OccurrenceScalarFieldEnumSchema = z.enum(['id','lib_id','analysis_run_name','featureid','organismQuantity']);

export const AssignmentScalarFieldEnumSchema = z.enum(['id','analysis_run_name','featureid','taxonomy','Confidence','percent_id','consensus']);

export const FeatureScalarFieldEnumSchema = z.enum(['id','featureid','dna_sequence','sequenceLength_ODE']);

export const TaxonomyScalarFieldEnumSchema = z.enum(['id','taxonomy','verbatimIdentification','higherClassification','domain','supergroup','division','kingdom','phylum','class','order','family','genus','species']);

export const TagScalarFieldEnumSchema = z.enum(['id','tagName','description','color']);

export const AlphaDiversityScalarFieldEnumSchema = z.enum(['id','dateCalculated','finished','analysis_run_name','indexType','depth']);

export const AlphaDiversityIndexScalarFieldEnumSchema = z.enum(['id','lib_id','parentId','index']);

export const ProjectScalarFieldEnumSchema = z.enum(['id','project_id','userIds','dateSubmitted','isPrivate','userDefined','editHistory','projectMetadataFileUrl_ODE','projectMetadataFileChecksum_ODE','sampleMetadataFileUrl_ODE','sampleMetadataFileChecksum_ODE','libraryMetadataFileUrl_ODE','libraryMetadataFileChecksum_ODE','imageFileUrl_ODE','recordedBy','recordedByID','project_contact','institution','institutionID','project_name','parent_project_id','study_factor','assay_type','neg_cont_0_1','pos_cont_0_1','projectDescription','dataDescription','license','rightsHolder','accessRights','informationWithheld','dataGeneralizations','bibliographicCitation','associated_resource','mod_date','checkls_ver','seq_archive','code_repo','biological_rep','sample_type']);

export const SampleScalarFieldEnumSchema = z.enum(['id','samp_name','biosample_accession','userDefined','project_id','deleted_ODE','samp_category','neg_cont_type','pos_cont_type','decimalLatitude','decimalLongitude','verbatimLatitude','verbatimLongitude','verbatimCoordinateSystem','verbatimSRS','geo_loc_name','eventDate','eventDate_Midpoint_ODE','eventDate_End_ODE','eventDurationValue','eventDurationUnit','verbatimEventDate','verbatimEventTime','verbatimDateEnd','verbatimTimeEnd','env_broad_scale','env_local_scale','env_medium','habitat_natural_artificial_0_1','samp_collect_method','samp_collect_device','samp_size','samp_size_unit','serial_number','line_id','station_id','ctd_cast_number','ctd_bottle_number','replicate_number','samp_collect_notes','samp_store_temp','samp_store_sol','samp_store_dur','samp_store_method_additional','dna_store_loc','samp_store_loc','samp_mat_process','filter_passive_active_0_1','filter_onsite_dur','size_frac_low','size_frac','filter_diameter','filter_surface_area','filter_material','filter_name','precip_chem_prep','precip_force_prep','precip_time_prep','precip_temp_prep','prepped_samp_store_temp','prepped_samp_store_sol','prepped_samp_store_dur','prep_method_additional','prefilter_material','pump_flow_rate','pump_flow_rate_unit','stationed_sample_dur','extract_id','extract_plate','extract_well_number','extract_well_position','materialSampleID','sample_derived_from','sample_composed_of','rel_cont_id','biological_rep_relation','samp_vol_we_dna_ext','samp_vol_we_dna_ext_unit','nucl_acid_ext_lysis','nucl_acid_ext_sep','nucl_acid_ext','nucl_acid_ext_kit','nucl_acid_ext_modify','dna_cleanup_0_1','dna_cleanup_method','concentration','concentration_method','ratioOfAbsorbance260_280','pool_dna_num','nucl_acid_ext_method_additional','concentration_unit','date_ext','dna_yield','dna_yield_unit','samp_weather','minimumDepthInMeters','maximumDepthInMeters','tot_depth_water_col','elev','temp','chlorophyll','light_intensity','misc_param','ph','ph_meth','salinity','suspend_part_matter','tidal_stage','turbidity','water_current','solar_irradiance','wind_direction','wind_speed','diss_inorg_carb','diss_inorg_nitro','diss_org_carb','diss_org_nitro','diss_oxygen','tot_diss_nitro','tot_inorg_nitro','tot_nitro','tot_part_carb','tot_org_carb','tot_org_c_meth','tot_nitro_content','tot_nitro_cont_meth','tot_carb','part_org_carb','part_org_nitro','nitrate','nitrite','nitro','org_carb','org_matter','org_nitro','diss_inorg_carb_unit','diss_inorg_nitro_unit','diss_org_carb_unit','diss_org_nitro_unit','diss_oxygen_unit','nitrate_unit','nitrite_unit','nitro_unit','org_carb_unit','org_matter_unit','org_nitro_unit','part_org_carb_unit','part_org_nitro_unit','tot_carb_unit','tot_diss_nitro_unit','tot_inorg_nitro_unit','tot_nitro_content_unit','tot_nitro_unit','tot_org_carb_unit','tot_part_carb_unit','ammonium','ammonium_unit','carbonate','carbonate_unit','hydrogen_ion','nitrate_plus_nitrite','nitrate_plus_nitrite_unit','omega_arag','pco2','pco2_unit','phosphate','phosphate_unit','pressure','pressure_unit','silicate','silicate_unit','tot_alkalinity','tot_alkalinity_unit','transmittance','transmittance_unit','organism','sterilise_method','short_name','expedition_id','ship_crs_expocode','woce_sect','bioproject_accession']);

export const AssayScalarFieldEnumSchema = z.enum(['id','assay_name','pcr_primer_forward','pcr_primer_reverse','pcr_primer_name_forward','pcr_primer_name_reverse','assay_name_alternate','targetTaxonomicAssay','targetTaxonomicScope','target','target_gene','target_subfragment','pcr_primer_name_published_forward','pcr_primer_name_published_reverse','pcr_primer_reference_forward','pcr_primer_reference_reverse','assay_reference']);

export const AssayPrepScalarFieldEnumSchema = z.enum(['id','project_id','assay_name','thermocycler','commercial_mm','custom_mm','pcr_cond','nucl_acid_amp','pcr_0_1','amplificationReactionVolume','assay_validation','pcr_primer_vol_forward','pcr_primer_vol_reverse','pcr_primer_conc_forward','pcr_primer_conc_reverse','probeReporter','probeQuencher','probe_seq','probe_ref','probe_conc','pcr_dna_vol','pcr_rep','annealingTemp','pcr_cycles','pcr_analysis_software','pcr_method_additional','assay_type','ampliconSize','ampliconSize_Midpoint_ODE','ampliconSize_End_ODE']);

export const LibraryScalarFieldEnumSchema = z.enum(['id','lib_id','userDefined','project_id','samp_name','assay_name','barcoding_pcr_appr','platform','instrument','seq_kit','lib_layout','sequencing_location','adapter_forward','adapter_reverse','lib_screen','seq_method_additional','mid_forward','mid_reverse','filename','filename2','seq_run_id','input_read_count','checksum_filename','checksum_filename2','lib_conc','lib_conc_meth','lib_conc_unit','phix_perc','checksum_method','pcr2_amplificationReactionVolume','pcr2_analysis_software','pcr2_annealingTemp','pcr2_commercial_mm','pcr2_cond','pcr2_custom_mm','pcr2_cycles','pcr2_dna_vol','pcr2_method_additional','pcr2_plate_id','pcr2_thermocycler','associatedSequences','pcr_plate_id','block_ref','block_seq','block_taxa','inhibition_check','inhibition_check_0_1']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullableJsonNullValueInputSchema: z.ZodType<Prisma.NullableJsonNullValueInput> = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const JsonNullValueFilterSchema: z.ZodType<Prisma.JsonNullValueFilter> = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value === 'AnyNull' ? Prisma.AnyNull : value);

export const NullsOrderSchema = z.enum(['first','last']);

export const AnalysisOrderByRelevanceFieldEnumSchema = z.enum(['analysis_run_name','project_id','assay_name','analysisMetadataFileUrl_ODE','analysisMetadataFileChecksum_ODE','asvFileUrl_ODE','asvFileChecksum_ODE','occurrenceFileUrl_ODE','occurrenceFileChecksum_ODE','sop_bioinformatics','trim_method','trim_param','demux_tool','merge_tool','min_len_tool','error_rate_tool','error_rate_type','chimera_check_method','chimera_check_param','otu_clust_tool','min_reads_cutoff_unit','min_reads_tool','otu_db','otu_db_custom','tax_assign_cat','otu_seq_comp_appr','tax_class_collapse','tax_class_other','screen_contam_method','screen_geograph_method','screen_nontarget_method','screen_other','bioinfo_method_additional','asv_method','dada2_pooling_method','dada2_chimera_method','otu_final_description','otu_raw_description','qiime2_version','tourmaline_asv_method','tourmaline_classify_method']);

export const OccurrenceOrderByRelevanceFieldEnumSchema = z.enum(['lib_id','analysis_run_name','featureid']);

export const AssignmentOrderByRelevanceFieldEnumSchema = z.enum(['analysis_run_name','featureid','taxonomy']);

export const FeatureOrderByRelevanceFieldEnumSchema = z.enum(['featureid','dna_sequence']);

export const TaxonomyOrderByRelevanceFieldEnumSchema = z.enum(['taxonomy','verbatimIdentification','higherClassification','domain','supergroup','division','kingdom','phylum','class','order','family','genus','species']);

export const TagOrderByRelevanceFieldEnumSchema = z.enum(['tagName','description','color']);

export const AlphaDiversityOrderByRelevanceFieldEnumSchema = z.enum(['analysis_run_name','indexType']);

export const AlphaDiversityIndexOrderByRelevanceFieldEnumSchema = z.enum(['lib_id']);

export const ProjectOrderByRelevanceFieldEnumSchema = z.enum(['project_id','userIds','projectMetadataFileUrl_ODE','projectMetadataFileChecksum_ODE','sampleMetadataFileUrl_ODE','sampleMetadataFileChecksum_ODE','libraryMetadataFileUrl_ODE','libraryMetadataFileChecksum_ODE','imageFileUrl_ODE','recordedBy','recordedByID','project_contact','institution','institutionID','project_name','parent_project_id','study_factor','assay_type','projectDescription','dataDescription','license','rightsHolder','accessRights','informationWithheld','dataGeneralizations','bibliographicCitation','associated_resource','checkls_ver','seq_archive','code_repo','sample_type']);

export const SampleOrderByRelevanceFieldEnumSchema = z.enum(['samp_name','biosample_accession','project_id','samp_category','neg_cont_type','pos_cont_type','verbatimLatitude','verbatimLongitude','verbatimCoordinateSystem','verbatimSRS','geo_loc_name','eventDurationValue','eventDurationUnit','verbatimEventDate','verbatimEventTime','verbatimDateEnd','verbatimTimeEnd','env_broad_scale','env_local_scale','env_medium','samp_collect_method','samp_collect_device','samp_size_unit','serial_number','line_id','station_id','ctd_cast_number','ctd_bottle_number','replicate_number','samp_collect_notes','samp_store_sol','samp_store_dur','samp_store_method_additional','dna_store_loc','samp_store_loc','samp_mat_process','filter_onsite_dur','size_frac_low','filter_material','filter_name','precip_chem_prep','prepped_samp_store_temp','prepped_samp_store_sol','prepped_samp_store_dur','prep_method_additional','prefilter_material','pump_flow_rate_unit','stationed_sample_dur','extract_id','extract_plate','extract_well_position','materialSampleID','sample_derived_from','sample_composed_of','rel_cont_id','biological_rep_relation','samp_vol_we_dna_ext_unit','nucl_acid_ext_lysis','nucl_acid_ext_sep','nucl_acid_ext','nucl_acid_ext_kit','nucl_acid_ext_modify','dna_cleanup_method','concentration_method','nucl_acid_ext_method_additional','concentration_unit','dna_yield_unit','samp_weather','ph_meth','tidal_stage','solar_irradiance','wind_direction','diss_inorg_carb_unit','diss_inorg_nitro_unit','diss_org_carb_unit','diss_org_nitro_unit','diss_oxygen_unit','nitrate_unit','nitrite_unit','nitro_unit','org_carb_unit','org_matter_unit','org_nitro_unit','part_org_carb_unit','part_org_nitro_unit','tot_carb_unit','tot_diss_nitro_unit','tot_inorg_nitro_unit','tot_nitro_content_unit','tot_nitro_unit','tot_org_carb_unit','tot_part_carb_unit','ammonium','ammonium_unit','carbonate_unit','nitrate_plus_nitrite_unit','pco2_unit','phosphate_unit','pressure_unit','silicate_unit','tot_alkalinity_unit','transmittance_unit','organism','sterilise_method','short_name','expedition_id','ship_crs_expocode','woce_sect','bioproject_accession']);

export const AssayOrderByRelevanceFieldEnumSchema = z.enum(['assay_name','pcr_primer_forward','pcr_primer_reverse','pcr_primer_name_forward','pcr_primer_name_reverse','assay_name_alternate','targetTaxonomicAssay','targetTaxonomicScope','target','target_gene','target_subfragment','pcr_primer_name_published_forward','pcr_primer_name_published_reverse','pcr_primer_reference_forward','pcr_primer_reference_reverse','assay_reference']);

export const AssayPrepOrderByRelevanceFieldEnumSchema = z.enum(['project_id','assay_name','thermocycler','commercial_mm','custom_mm','pcr_cond','nucl_acid_amp','assay_validation','probeReporter','probeQuencher','probe_seq','probe_ref','annealingTemp','pcr_analysis_software','pcr_method_additional','assay_type']);

export const LibraryOrderByRelevanceFieldEnumSchema = z.enum(['lib_id','project_id','samp_name','assay_name','barcoding_pcr_appr','platform','instrument','seq_kit','lib_layout','sequencing_location','adapter_forward','adapter_reverse','lib_screen','seq_method_additional','mid_forward','mid_reverse','filename','filename2','seq_run_id','checksum_filename','checksum_filename2','lib_conc_meth','lib_conc_unit','checksum_method','pcr2_analysis_software','pcr2_commercial_mm','pcr2_cond','pcr2_custom_mm','pcr2_method_additional','pcr2_plate_id','pcr2_thermocycler','associatedSequences','pcr_plate_id','block_ref','block_seq','block_taxa','inhibition_check']);

export const DeadBooleanSchema = z.enum(['false','true','not_applicableCOLON__control_sample','not_applicableCOLON__sample_group','not_applicable','missingCOLON__not_collectedCOLON__synthetic_construct','missingCOLON__not_collectedCOLON__lab_stock','missingCOLON__not_collectedCOLON__third_party_data','missingCOLON__not_collected','missingCOLON__not_providedCOLON__data_agreement_established_pre__2023','missingCOLON__not_provided','missingCOLON__restricted_accessCOLON__endangered_species','missingCOLON__restricted_accessCOLON__human__identifiable','missingCOLON__restricted_access','missing','not_collected','not_provided','restricted_access','missingCOLON__control_sample','missingCOLON__sample_group','missingCOLON__synthetic_construct','missingCOLON__lab_stock','missingCOLON__third_party_data','missingCOLON__data_agreement_established_pre__2023','missingCOLON__endangered_species','missingCOLON__human__identifiable']);

export type DeadBooleanType = `${z.infer<typeof DeadBooleanSchema>}`

export const target_geneSchema = z.enum(['TWELVE__S_rRNA','SIXTEEN__S_rRNA','EIGHTEEN__S_rRNA','TWENTY_THREE__S_rRNA','TWENTY_EIGHT__S_rRNA','rbcL','CytB','COI','COII','COIII','nifH','ITS','ND1','ND2','ND3','ND4','ND5','ND6','amoA','rpoB','rpoC1','rpoC2','matK','trnH','trnL','psbK','D__loop','other']);

export type target_geneType = `${z.infer<typeof target_geneSchema>}`

export const asv_methodSchema = z.enum(['dada2pe','dada2se','deblur','other']);

export type asv_methodType = `${z.infer<typeof asv_methodSchema>}`

export const assay_typeSchema = z.enum(['targeted','metabarcoding','other']);

export type assay_typeType = `${z.infer<typeof assay_typeSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// ANALYSIS SCHEMA
/////////////////////////////////////////

export const AnalysisSchema = z.object({
  discard_untrimmed: DeadBooleanSchema.nullish(),
  id: z.number().int(),
  analysis_run_name: z.string(),
  dateSubmitted: z.coerce.date(),
  isPrivate: z.boolean(),
  trusted: z.boolean(),
  /**
   * [EditHistoryType]
   */
  editHistory: JsonValueSchema.nullable(),
  project_id: z.string(),
  assay_name: z.string(),
  analysisMetadataFileUrl_ODE: z.string(),
  analysisMetadataFileChecksum_ODE: z.string(),
  asvFileUrl_ODE: z.string(),
  asvFileChecksum_ODE: z.string(),
  occurrenceFileUrl_ODE: z.string(),
  occurrenceFileChecksum_ODE: z.string(),
  sop_bioinformatics: z.string().nullish(),
  trim_method: z.string().nullish(),
  trim_param: z.string().nullish(),
  demux_tool: z.string().nullish(),
  demux_max_mismatch: z.number().int().nullish(),
  merge_tool: z.string().nullish(),
  merge_min_overlap: z.number().int().nullish(),
  min_len_cutoff: z.number().int().nullish(),
  min_len_tool: z.string().nullish(),
  error_rate_tool: z.string().nullish(),
  error_rate_type: z.string().nullish(),
  error_rate_cutoff: z.number().nullish(),
  chimera_check_method: z.string().nullish(),
  chimera_check_param: z.string().nullish(),
  otu_clust_tool: z.string().nullish(),
  otu_clust_cutoff: z.number().nullish(),
  min_reads_cutoff: z.number().nullish(),
  min_reads_cutoff_unit: z.string().nullish(),
  min_reads_tool: z.string().nullish(),
  otu_db: z.string().nullish(),
  otu_db_custom: z.string().nullish(),
  tax_assign_cat: z.string().nullish(),
  otu_seq_comp_appr: z.string().nullish(),
  tax_class_id_cutoff: z.number().nullish(),
  tax_class_query_cutoff: z.number().nullish(),
  tax_class_collapse: z.string().nullish(),
  tax_class_other: z.string().nullish(),
  screen_contam_method: z.string().nullish(),
  screen_geograph_method: z.string().nullish(),
  screen_nontarget_method: z.string().nullish(),
  screen_other: z.string().nullish(),
  bioinfo_method_additional: z.string().nullish(),
  asv_method: z.string().nullish(),
  dada2_trunc_len_f: z.number().int().nullish(),
  dada2pe_trunc_len_r: z.number().int().nullish(),
  dada2_trim_left_f: z.number().int().nullish(),
  dada2pe_trim_left_r: z.number().int().nullish(),
  dada2_max_ee_f: z.number().int().nullish(),
  dada2pe_max_ee_r: z.number().int().nullish(),
  dada2_trunc_q: z.number().int().nullish(),
  dada2_pooling_method: z.string().nullish(),
  dada2_chimera_method: z.string().nullish(),
  dada2_min_fold_parent_over_abundance: z.number().int().nullish(),
  dada2_n_reads_learn: z.number().int().nullish(),
  deblur_trim_length: z.number().int().nullish(),
  deblur_mean_error: z.number().nullish(),
  deblur_indel_prob: z.number().nullish(),
  deblur_indel_max: z.number().int().nullish(),
  deblur_min_reads: z.number().int().nullish(),
  deblur_min_size: z.number().int().nullish(),
  repseqs_min_length: z.number().int().nullish(),
  repseqs_max_length: z.number().int().nullish(),
  repseqs_min_abundance: z.number().nullish(),
  repseqs_min_prevalence: z.number().nullish(),
  otu_num_tax_assigned: z.number().int().nullish(),
  output_otu_num: z.number().int().nullish(),
  output_read_count: z.number().int().nullish(),
  otu_final_description: z.string().nullish(),
  otu_raw_description: z.string().nullish(),
  qiime2_version: z.string().nullish(),
  tourmaline_asv_method: z.string().nullish(),
  skl_confidence: z.number().nullish(),
  min_consensus: z.number().nullish(),
  tourmaline_classify_method: z.string().nullish(),
  blca_confidence: z.number().nullish(),
  percent_match: z.number().nullish(),
  percent_match_Midpoint_ODE: z.number().nullish(),
  percent_match_End_ODE: z.number().nullish(),
  percent_query_cover: z.number().nullish(),
  percent_query_cover_Midpoint_ODE: z.number().nullish(),
  percent_query_cover_End_ODE: z.number().nullish(),
})

export type Analysis = z.infer<typeof AnalysisSchema>

/////////////////////////////////////////
// ANALYSIS PARTIAL SCHEMA
/////////////////////////////////////////

export const AnalysisPartialSchema = AnalysisSchema.partial()

export type AnalysisPartial = z.infer<typeof AnalysisPartialSchema>

// ANALYSIS OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const AnalysisOptionalDefaultsSchema = AnalysisSchema.merge(z.object({
  id: z.number().int().optional(),
  dateSubmitted: z.coerce.date().optional(),
}))

export type AnalysisOptionalDefaults = z.infer<typeof AnalysisOptionalDefaultsSchema>

// ANALYSIS RELATION SCHEMA
//------------------------------------------------------

export type AnalysisRelations = {
  Project: ProjectWithRelations;
  Assay: AssayWithRelations;
  Occurrences: OccurrenceWithRelations[];
  Assignments: AssignmentWithRelations[];
  Tags: TagWithRelations[];
  AlphaDiversities: AlphaDiversityWithRelations[];
};

export type AnalysisWithRelations = Omit<z.infer<typeof AnalysisSchema>, "editHistory"> & {
  editHistory?: JsonValueType | null;
} & AnalysisRelations

export const AnalysisWithRelationsSchema: z.ZodType<AnalysisWithRelations> = AnalysisSchema.merge(z.object({
  Project: z.lazy(() => ProjectWithRelationsSchema),
  Assay: z.lazy(() => AssayWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrenceWithRelationsSchema).array(),
  Assignments: z.lazy(() => AssignmentWithRelationsSchema).array(),
  Tags: z.lazy(() => TagWithRelationsSchema).array(),
  AlphaDiversities: z.lazy(() => AlphaDiversityWithRelationsSchema).array(),
}))

// ANALYSIS OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type AnalysisOptionalDefaultsRelations = {
  Project: ProjectOptionalDefaultsWithRelations;
  Assay: AssayOptionalDefaultsWithRelations;
  Occurrences: OccurrenceOptionalDefaultsWithRelations[];
  Assignments: AssignmentOptionalDefaultsWithRelations[];
  Tags: TagOptionalDefaultsWithRelations[];
  AlphaDiversities: AlphaDiversityOptionalDefaultsWithRelations[];
};

export type AnalysisOptionalDefaultsWithRelations = Omit<z.infer<typeof AnalysisOptionalDefaultsSchema>, "editHistory"> & {
  editHistory?: JsonValueType | null;
} & AnalysisOptionalDefaultsRelations

export const AnalysisOptionalDefaultsWithRelationsSchema: z.ZodType<AnalysisOptionalDefaultsWithRelations> = AnalysisOptionalDefaultsSchema.merge(z.object({
  Project: z.lazy(() => ProjectOptionalDefaultsWithRelationsSchema),
  Assay: z.lazy(() => AssayOptionalDefaultsWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrenceOptionalDefaultsWithRelationsSchema).array(),
  Assignments: z.lazy(() => AssignmentOptionalDefaultsWithRelationsSchema).array(),
  Tags: z.lazy(() => TagOptionalDefaultsWithRelationsSchema).array(),
  AlphaDiversities: z.lazy(() => AlphaDiversityOptionalDefaultsWithRelationsSchema).array(),
}))

// ANALYSIS PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type AnalysisPartialRelations = {
  Project?: ProjectPartialWithRelations;
  Assay?: AssayPartialWithRelations;
  Occurrences?: OccurrencePartialWithRelations[];
  Assignments?: AssignmentPartialWithRelations[];
  Tags?: TagPartialWithRelations[];
  AlphaDiversities?: AlphaDiversityPartialWithRelations[];
};

export type AnalysisPartialWithRelations = Omit<z.infer<typeof AnalysisPartialSchema>, "editHistory"> & {
  editHistory?: JsonValueType | null;
} & AnalysisPartialRelations

export const AnalysisPartialWithRelationsSchema: z.ZodType<AnalysisPartialWithRelations> = AnalysisPartialSchema.merge(z.object({
  Project: z.lazy(() => ProjectPartialWithRelationsSchema),
  Assay: z.lazy(() => AssayPartialWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrencePartialWithRelationsSchema).array(),
  Assignments: z.lazy(() => AssignmentPartialWithRelationsSchema).array(),
  Tags: z.lazy(() => TagPartialWithRelationsSchema).array(),
  AlphaDiversities: z.lazy(() => AlphaDiversityPartialWithRelationsSchema).array(),
})).partial()

export type AnalysisOptionalDefaultsWithPartialRelations = Omit<z.infer<typeof AnalysisOptionalDefaultsSchema>, "editHistory"> & {
  editHistory?: JsonValueType | null;
} & AnalysisPartialRelations

export const AnalysisOptionalDefaultsWithPartialRelationsSchema: z.ZodType<AnalysisOptionalDefaultsWithPartialRelations> = AnalysisOptionalDefaultsSchema.merge(z.object({
  Project: z.lazy(() => ProjectPartialWithRelationsSchema),
  Assay: z.lazy(() => AssayPartialWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrencePartialWithRelationsSchema).array(),
  Assignments: z.lazy(() => AssignmentPartialWithRelationsSchema).array(),
  Tags: z.lazy(() => TagPartialWithRelationsSchema).array(),
  AlphaDiversities: z.lazy(() => AlphaDiversityPartialWithRelationsSchema).array(),
}).partial())

export type AnalysisWithPartialRelations = Omit<z.infer<typeof AnalysisSchema>, "editHistory"> & {
  editHistory?: JsonValueType | null;
} & AnalysisPartialRelations

export const AnalysisWithPartialRelationsSchema: z.ZodType<AnalysisWithPartialRelations> = AnalysisSchema.merge(z.object({
  Project: z.lazy(() => ProjectPartialWithRelationsSchema),
  Assay: z.lazy(() => AssayPartialWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrencePartialWithRelationsSchema).array(),
  Assignments: z.lazy(() => AssignmentPartialWithRelationsSchema).array(),
  Tags: z.lazy(() => TagPartialWithRelationsSchema).array(),
  AlphaDiversities: z.lazy(() => AlphaDiversityPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// OCCURRENCE SCHEMA
/////////////////////////////////////////

export const OccurrenceSchema = z.object({
  id: z.number().int(),
  lib_id: z.string(),
  analysis_run_name: z.string(),
  featureid: z.string(),
  organismQuantity: z.number().int(),
})

export type Occurrence = z.infer<typeof OccurrenceSchema>

/////////////////////////////////////////
// OCCURRENCE PARTIAL SCHEMA
/////////////////////////////////////////

export const OccurrencePartialSchema = OccurrenceSchema.partial()

export type OccurrencePartial = z.infer<typeof OccurrencePartialSchema>

// OCCURRENCE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const OccurrenceOptionalDefaultsSchema = OccurrenceSchema.merge(z.object({
  id: z.number().int().optional(),
}))

export type OccurrenceOptionalDefaults = z.infer<typeof OccurrenceOptionalDefaultsSchema>

// OCCURRENCE RELATION SCHEMA
//------------------------------------------------------

export type OccurrenceRelations = {
  Library: LibraryWithRelations;
  Analysis: AnalysisWithRelations;
  Feature: FeatureWithRelations;
  Assignment: AssignmentWithRelations;
};

export type OccurrenceWithRelations = z.infer<typeof OccurrenceSchema> & OccurrenceRelations

export const OccurrenceWithRelationsSchema: z.ZodType<OccurrenceWithRelations> = OccurrenceSchema.merge(z.object({
  Library: z.lazy(() => LibraryWithRelationsSchema),
  Analysis: z.lazy(() => AnalysisWithRelationsSchema),
  Feature: z.lazy(() => FeatureWithRelationsSchema),
  Assignment: z.lazy(() => AssignmentWithRelationsSchema),
}))

// OCCURRENCE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type OccurrenceOptionalDefaultsRelations = {
  Library: LibraryOptionalDefaultsWithRelations;
  Analysis: AnalysisOptionalDefaultsWithRelations;
  Feature: FeatureOptionalDefaultsWithRelations;
  Assignment: AssignmentOptionalDefaultsWithRelations;
};

export type OccurrenceOptionalDefaultsWithRelations = z.infer<typeof OccurrenceOptionalDefaultsSchema> & OccurrenceOptionalDefaultsRelations

export const OccurrenceOptionalDefaultsWithRelationsSchema: z.ZodType<OccurrenceOptionalDefaultsWithRelations> = OccurrenceOptionalDefaultsSchema.merge(z.object({
  Library: z.lazy(() => LibraryOptionalDefaultsWithRelationsSchema),
  Analysis: z.lazy(() => AnalysisOptionalDefaultsWithRelationsSchema),
  Feature: z.lazy(() => FeatureOptionalDefaultsWithRelationsSchema),
  Assignment: z.lazy(() => AssignmentOptionalDefaultsWithRelationsSchema),
}))

// OCCURRENCE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type OccurrencePartialRelations = {
  Library?: LibraryPartialWithRelations;
  Analysis?: AnalysisPartialWithRelations;
  Feature?: FeaturePartialWithRelations;
  Assignment?: AssignmentPartialWithRelations;
};

export type OccurrencePartialWithRelations = z.infer<typeof OccurrencePartialSchema> & OccurrencePartialRelations

export const OccurrencePartialWithRelationsSchema: z.ZodType<OccurrencePartialWithRelations> = OccurrencePartialSchema.merge(z.object({
  Library: z.lazy(() => LibraryPartialWithRelationsSchema),
  Analysis: z.lazy(() => AnalysisPartialWithRelationsSchema),
  Feature: z.lazy(() => FeaturePartialWithRelationsSchema),
  Assignment: z.lazy(() => AssignmentPartialWithRelationsSchema),
})).partial()

export type OccurrenceOptionalDefaultsWithPartialRelations = z.infer<typeof OccurrenceOptionalDefaultsSchema> & OccurrencePartialRelations

export const OccurrenceOptionalDefaultsWithPartialRelationsSchema: z.ZodType<OccurrenceOptionalDefaultsWithPartialRelations> = OccurrenceOptionalDefaultsSchema.merge(z.object({
  Library: z.lazy(() => LibraryPartialWithRelationsSchema),
  Analysis: z.lazy(() => AnalysisPartialWithRelationsSchema),
  Feature: z.lazy(() => FeaturePartialWithRelationsSchema),
  Assignment: z.lazy(() => AssignmentPartialWithRelationsSchema),
}).partial())

export type OccurrenceWithPartialRelations = z.infer<typeof OccurrenceSchema> & OccurrencePartialRelations

export const OccurrenceWithPartialRelationsSchema: z.ZodType<OccurrenceWithPartialRelations> = OccurrenceSchema.merge(z.object({
  Library: z.lazy(() => LibraryPartialWithRelationsSchema),
  Analysis: z.lazy(() => AnalysisPartialWithRelationsSchema),
  Feature: z.lazy(() => FeaturePartialWithRelationsSchema),
  Assignment: z.lazy(() => AssignmentPartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// ASSIGNMENT SCHEMA
/////////////////////////////////////////

export const AssignmentSchema = z.object({
  id: z.number().int(),
  analysis_run_name: z.string(),
  featureid: z.string(),
  taxonomy: z.string(),
  Confidence: z.number().nullish(),
  percent_id: z.number().nullish(),
  consensus: z.number().nullish(),
})

export type Assignment = z.infer<typeof AssignmentSchema>

/////////////////////////////////////////
// ASSIGNMENT PARTIAL SCHEMA
/////////////////////////////////////////

export const AssignmentPartialSchema = AssignmentSchema.partial()

export type AssignmentPartial = z.infer<typeof AssignmentPartialSchema>

// ASSIGNMENT OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const AssignmentOptionalDefaultsSchema = AssignmentSchema.merge(z.object({
  id: z.number().int().optional(),
}))

export type AssignmentOptionalDefaults = z.infer<typeof AssignmentOptionalDefaultsSchema>

// ASSIGNMENT RELATION SCHEMA
//------------------------------------------------------

export type AssignmentRelations = {
  Analysis: AnalysisWithRelations;
  Feature: FeatureWithRelations;
  Taxonomy: TaxonomyWithRelations;
  Occurrences: OccurrenceWithRelations[];
};

export type AssignmentWithRelations = z.infer<typeof AssignmentSchema> & AssignmentRelations

export const AssignmentWithRelationsSchema: z.ZodType<AssignmentWithRelations> = AssignmentSchema.merge(z.object({
  Analysis: z.lazy(() => AnalysisWithRelationsSchema),
  Feature: z.lazy(() => FeatureWithRelationsSchema),
  Taxonomy: z.lazy(() => TaxonomyWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrenceWithRelationsSchema).array(),
}))

// ASSIGNMENT OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type AssignmentOptionalDefaultsRelations = {
  Analysis: AnalysisOptionalDefaultsWithRelations;
  Feature: FeatureOptionalDefaultsWithRelations;
  Taxonomy: TaxonomyOptionalDefaultsWithRelations;
  Occurrences: OccurrenceOptionalDefaultsWithRelations[];
};

export type AssignmentOptionalDefaultsWithRelations = z.infer<typeof AssignmentOptionalDefaultsSchema> & AssignmentOptionalDefaultsRelations

export const AssignmentOptionalDefaultsWithRelationsSchema: z.ZodType<AssignmentOptionalDefaultsWithRelations> = AssignmentOptionalDefaultsSchema.merge(z.object({
  Analysis: z.lazy(() => AnalysisOptionalDefaultsWithRelationsSchema),
  Feature: z.lazy(() => FeatureOptionalDefaultsWithRelationsSchema),
  Taxonomy: z.lazy(() => TaxonomyOptionalDefaultsWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrenceOptionalDefaultsWithRelationsSchema).array(),
}))

// ASSIGNMENT PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type AssignmentPartialRelations = {
  Analysis?: AnalysisPartialWithRelations;
  Feature?: FeaturePartialWithRelations;
  Taxonomy?: TaxonomyPartialWithRelations;
  Occurrences?: OccurrencePartialWithRelations[];
};

export type AssignmentPartialWithRelations = z.infer<typeof AssignmentPartialSchema> & AssignmentPartialRelations

export const AssignmentPartialWithRelationsSchema: z.ZodType<AssignmentPartialWithRelations> = AssignmentPartialSchema.merge(z.object({
  Analysis: z.lazy(() => AnalysisPartialWithRelationsSchema),
  Feature: z.lazy(() => FeaturePartialWithRelationsSchema),
  Taxonomy: z.lazy(() => TaxonomyPartialWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrencePartialWithRelationsSchema).array(),
})).partial()

export type AssignmentOptionalDefaultsWithPartialRelations = z.infer<typeof AssignmentOptionalDefaultsSchema> & AssignmentPartialRelations

export const AssignmentOptionalDefaultsWithPartialRelationsSchema: z.ZodType<AssignmentOptionalDefaultsWithPartialRelations> = AssignmentOptionalDefaultsSchema.merge(z.object({
  Analysis: z.lazy(() => AnalysisPartialWithRelationsSchema),
  Feature: z.lazy(() => FeaturePartialWithRelationsSchema),
  Taxonomy: z.lazy(() => TaxonomyPartialWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrencePartialWithRelationsSchema).array(),
}).partial())

export type AssignmentWithPartialRelations = z.infer<typeof AssignmentSchema> & AssignmentPartialRelations

export const AssignmentWithPartialRelationsSchema: z.ZodType<AssignmentWithPartialRelations> = AssignmentSchema.merge(z.object({
  Analysis: z.lazy(() => AnalysisPartialWithRelationsSchema),
  Feature: z.lazy(() => FeaturePartialWithRelationsSchema),
  Taxonomy: z.lazy(() => TaxonomyPartialWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrencePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// FEATURE SCHEMA
/////////////////////////////////////////

export const FeatureSchema = z.object({
  id: z.number().int(),
  featureid: z.string(),
  dna_sequence: z.string(),
  sequenceLength_ODE: z.number().int(),
})

export type Feature = z.infer<typeof FeatureSchema>

/////////////////////////////////////////
// FEATURE PARTIAL SCHEMA
/////////////////////////////////////////

export const FeaturePartialSchema = FeatureSchema.partial()

export type FeaturePartial = z.infer<typeof FeaturePartialSchema>

// FEATURE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const FeatureOptionalDefaultsSchema = FeatureSchema.merge(z.object({
  id: z.number().int().optional(),
}))

export type FeatureOptionalDefaults = z.infer<typeof FeatureOptionalDefaultsSchema>

// FEATURE RELATION SCHEMA
//------------------------------------------------------

export type FeatureRelations = {
  Occurrences: OccurrenceWithRelations[];
  Assignments: AssignmentWithRelations[];
};

export type FeatureWithRelations = z.infer<typeof FeatureSchema> & FeatureRelations

export const FeatureWithRelationsSchema: z.ZodType<FeatureWithRelations> = FeatureSchema.merge(z.object({
  Occurrences: z.lazy(() => OccurrenceWithRelationsSchema).array(),
  Assignments: z.lazy(() => AssignmentWithRelationsSchema).array(),
}))

// FEATURE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type FeatureOptionalDefaultsRelations = {
  Occurrences: OccurrenceOptionalDefaultsWithRelations[];
  Assignments: AssignmentOptionalDefaultsWithRelations[];
};

export type FeatureOptionalDefaultsWithRelations = z.infer<typeof FeatureOptionalDefaultsSchema> & FeatureOptionalDefaultsRelations

export const FeatureOptionalDefaultsWithRelationsSchema: z.ZodType<FeatureOptionalDefaultsWithRelations> = FeatureOptionalDefaultsSchema.merge(z.object({
  Occurrences: z.lazy(() => OccurrenceOptionalDefaultsWithRelationsSchema).array(),
  Assignments: z.lazy(() => AssignmentOptionalDefaultsWithRelationsSchema).array(),
}))

// FEATURE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type FeaturePartialRelations = {
  Occurrences?: OccurrencePartialWithRelations[];
  Assignments?: AssignmentPartialWithRelations[];
};

export type FeaturePartialWithRelations = z.infer<typeof FeaturePartialSchema> & FeaturePartialRelations

export const FeaturePartialWithRelationsSchema: z.ZodType<FeaturePartialWithRelations> = FeaturePartialSchema.merge(z.object({
  Occurrences: z.lazy(() => OccurrencePartialWithRelationsSchema).array(),
  Assignments: z.lazy(() => AssignmentPartialWithRelationsSchema).array(),
})).partial()

export type FeatureOptionalDefaultsWithPartialRelations = z.infer<typeof FeatureOptionalDefaultsSchema> & FeaturePartialRelations

export const FeatureOptionalDefaultsWithPartialRelationsSchema: z.ZodType<FeatureOptionalDefaultsWithPartialRelations> = FeatureOptionalDefaultsSchema.merge(z.object({
  Occurrences: z.lazy(() => OccurrencePartialWithRelationsSchema).array(),
  Assignments: z.lazy(() => AssignmentPartialWithRelationsSchema).array(),
}).partial())

export type FeatureWithPartialRelations = z.infer<typeof FeatureSchema> & FeaturePartialRelations

export const FeatureWithPartialRelationsSchema: z.ZodType<FeatureWithPartialRelations> = FeatureSchema.merge(z.object({
  Occurrences: z.lazy(() => OccurrencePartialWithRelationsSchema).array(),
  Assignments: z.lazy(() => AssignmentPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// TAXONOMY SCHEMA
/////////////////////////////////////////

export const TaxonomySchema = z.object({
  id: z.number().int(),
  taxonomy: z.string(),
  verbatimIdentification: z.string(),
  higherClassification: z.string().nullish(),
  domain: z.string().nullish(),
  supergroup: z.string().nullish(),
  division: z.string().nullish(),
  kingdom: z.string().nullish(),
  phylum: z.string().nullish(),
  class: z.string().nullish(),
  order: z.string().nullish(),
  family: z.string().nullish(),
  genus: z.string().nullish(),
  species: z.string().nullish(),
})

export type Taxonomy = z.infer<typeof TaxonomySchema>

/////////////////////////////////////////
// TAXONOMY PARTIAL SCHEMA
/////////////////////////////////////////

export const TaxonomyPartialSchema = TaxonomySchema.partial()

export type TaxonomyPartial = z.infer<typeof TaxonomyPartialSchema>

// TAXONOMY OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const TaxonomyOptionalDefaultsSchema = TaxonomySchema.merge(z.object({
  id: z.number().int().optional(),
}))

export type TaxonomyOptionalDefaults = z.infer<typeof TaxonomyOptionalDefaultsSchema>

// TAXONOMY RELATION SCHEMA
//------------------------------------------------------

export type TaxonomyRelations = {
  Assignments: AssignmentWithRelations[];
};

export type TaxonomyWithRelations = z.infer<typeof TaxonomySchema> & TaxonomyRelations

export const TaxonomyWithRelationsSchema: z.ZodType<TaxonomyWithRelations> = TaxonomySchema.merge(z.object({
  Assignments: z.lazy(() => AssignmentWithRelationsSchema).array(),
}))

// TAXONOMY OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type TaxonomyOptionalDefaultsRelations = {
  Assignments: AssignmentOptionalDefaultsWithRelations[];
};

export type TaxonomyOptionalDefaultsWithRelations = z.infer<typeof TaxonomyOptionalDefaultsSchema> & TaxonomyOptionalDefaultsRelations

export const TaxonomyOptionalDefaultsWithRelationsSchema: z.ZodType<TaxonomyOptionalDefaultsWithRelations> = TaxonomyOptionalDefaultsSchema.merge(z.object({
  Assignments: z.lazy(() => AssignmentOptionalDefaultsWithRelationsSchema).array(),
}))

// TAXONOMY PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type TaxonomyPartialRelations = {
  Assignments?: AssignmentPartialWithRelations[];
};

export type TaxonomyPartialWithRelations = z.infer<typeof TaxonomyPartialSchema> & TaxonomyPartialRelations

export const TaxonomyPartialWithRelationsSchema: z.ZodType<TaxonomyPartialWithRelations> = TaxonomyPartialSchema.merge(z.object({
  Assignments: z.lazy(() => AssignmentPartialWithRelationsSchema).array(),
})).partial()

export type TaxonomyOptionalDefaultsWithPartialRelations = z.infer<typeof TaxonomyOptionalDefaultsSchema> & TaxonomyPartialRelations

export const TaxonomyOptionalDefaultsWithPartialRelationsSchema: z.ZodType<TaxonomyOptionalDefaultsWithPartialRelations> = TaxonomyOptionalDefaultsSchema.merge(z.object({
  Assignments: z.lazy(() => AssignmentPartialWithRelationsSchema).array(),
}).partial())

export type TaxonomyWithPartialRelations = z.infer<typeof TaxonomySchema> & TaxonomyPartialRelations

export const TaxonomyWithPartialRelationsSchema: z.ZodType<TaxonomyWithPartialRelations> = TaxonomySchema.merge(z.object({
  Assignments: z.lazy(() => AssignmentPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// TAG SCHEMA
/////////////////////////////////////////

export const TagSchema = z.object({
  id: z.number().int(),
  tagName: z.string(),
  description: z.string(),
  color: z.string(),
})

export type Tag = z.infer<typeof TagSchema>

/////////////////////////////////////////
// TAG PARTIAL SCHEMA
/////////////////////////////////////////

export const TagPartialSchema = TagSchema.partial()

export type TagPartial = z.infer<typeof TagPartialSchema>

// TAG OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const TagOptionalDefaultsSchema = TagSchema.merge(z.object({
  id: z.number().int().optional(),
}))

export type TagOptionalDefaults = z.infer<typeof TagOptionalDefaultsSchema>

// TAG RELATION SCHEMA
//------------------------------------------------------

export type TagRelations = {
  Analyses: AnalysisWithRelations[];
};

export type TagWithRelations = z.infer<typeof TagSchema> & TagRelations

export const TagWithRelationsSchema: z.ZodType<TagWithRelations> = TagSchema.merge(z.object({
  Analyses: z.lazy(() => AnalysisWithRelationsSchema).array(),
}))

// TAG OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type TagOptionalDefaultsRelations = {
  Analyses: AnalysisOptionalDefaultsWithRelations[];
};

export type TagOptionalDefaultsWithRelations = z.infer<typeof TagOptionalDefaultsSchema> & TagOptionalDefaultsRelations

export const TagOptionalDefaultsWithRelationsSchema: z.ZodType<TagOptionalDefaultsWithRelations> = TagOptionalDefaultsSchema.merge(z.object({
  Analyses: z.lazy(() => AnalysisOptionalDefaultsWithRelationsSchema).array(),
}))

// TAG PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type TagPartialRelations = {
  Analyses?: AnalysisPartialWithRelations[];
};

export type TagPartialWithRelations = z.infer<typeof TagPartialSchema> & TagPartialRelations

export const TagPartialWithRelationsSchema: z.ZodType<TagPartialWithRelations> = TagPartialSchema.merge(z.object({
  Analyses: z.lazy(() => AnalysisPartialWithRelationsSchema).array(),
})).partial()

export type TagOptionalDefaultsWithPartialRelations = z.infer<typeof TagOptionalDefaultsSchema> & TagPartialRelations

export const TagOptionalDefaultsWithPartialRelationsSchema: z.ZodType<TagOptionalDefaultsWithPartialRelations> = TagOptionalDefaultsSchema.merge(z.object({
  Analyses: z.lazy(() => AnalysisPartialWithRelationsSchema).array(),
}).partial())

export type TagWithPartialRelations = z.infer<typeof TagSchema> & TagPartialRelations

export const TagWithPartialRelationsSchema: z.ZodType<TagWithPartialRelations> = TagSchema.merge(z.object({
  Analyses: z.lazy(() => AnalysisPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// ALPHA DIVERSITY SCHEMA
/////////////////////////////////////////

export const AlphaDiversitySchema = z.object({
  id: z.number().int(),
  dateCalculated: z.coerce.date(),
  finished: z.boolean(),
  analysis_run_name: z.string(),
  indexType: z.string(),
  depth: z.number().int().nullish(),
})

export type AlphaDiversity = z.infer<typeof AlphaDiversitySchema>

/////////////////////////////////////////
// ALPHA DIVERSITY PARTIAL SCHEMA
/////////////////////////////////////////

export const AlphaDiversityPartialSchema = AlphaDiversitySchema.partial()

export type AlphaDiversityPartial = z.infer<typeof AlphaDiversityPartialSchema>

// ALPHA DIVERSITY OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const AlphaDiversityOptionalDefaultsSchema = AlphaDiversitySchema.merge(z.object({
  id: z.number().int().optional(),
  dateCalculated: z.coerce.date().optional(),
  finished: z.boolean().optional(),
}))

export type AlphaDiversityOptionalDefaults = z.infer<typeof AlphaDiversityOptionalDefaultsSchema>

// ALPHA DIVERSITY RELATION SCHEMA
//------------------------------------------------------

export type AlphaDiversityRelations = {
  Analysis: AnalysisWithRelations;
  AlphaDiversityIndexes: AlphaDiversityIndexWithRelations[];
};

export type AlphaDiversityWithRelations = z.infer<typeof AlphaDiversitySchema> & AlphaDiversityRelations

export const AlphaDiversityWithRelationsSchema: z.ZodType<AlphaDiversityWithRelations> = AlphaDiversitySchema.merge(z.object({
  Analysis: z.lazy(() => AnalysisWithRelationsSchema),
  AlphaDiversityIndexes: z.lazy(() => AlphaDiversityIndexWithRelationsSchema).array(),
}))

// ALPHA DIVERSITY OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type AlphaDiversityOptionalDefaultsRelations = {
  Analysis: AnalysisOptionalDefaultsWithRelations;
  AlphaDiversityIndexes: AlphaDiversityIndexOptionalDefaultsWithRelations[];
};

export type AlphaDiversityOptionalDefaultsWithRelations = z.infer<typeof AlphaDiversityOptionalDefaultsSchema> & AlphaDiversityOptionalDefaultsRelations

export const AlphaDiversityOptionalDefaultsWithRelationsSchema: z.ZodType<AlphaDiversityOptionalDefaultsWithRelations> = AlphaDiversityOptionalDefaultsSchema.merge(z.object({
  Analysis: z.lazy(() => AnalysisOptionalDefaultsWithRelationsSchema),
  AlphaDiversityIndexes: z.lazy(() => AlphaDiversityIndexOptionalDefaultsWithRelationsSchema).array(),
}))

// ALPHA DIVERSITY PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type AlphaDiversityPartialRelations = {
  Analysis?: AnalysisPartialWithRelations;
  AlphaDiversityIndexes?: AlphaDiversityIndexPartialWithRelations[];
};

export type AlphaDiversityPartialWithRelations = z.infer<typeof AlphaDiversityPartialSchema> & AlphaDiversityPartialRelations

export const AlphaDiversityPartialWithRelationsSchema: z.ZodType<AlphaDiversityPartialWithRelations> = AlphaDiversityPartialSchema.merge(z.object({
  Analysis: z.lazy(() => AnalysisPartialWithRelationsSchema),
  AlphaDiversityIndexes: z.lazy(() => AlphaDiversityIndexPartialWithRelationsSchema).array(),
})).partial()

export type AlphaDiversityOptionalDefaultsWithPartialRelations = z.infer<typeof AlphaDiversityOptionalDefaultsSchema> & AlphaDiversityPartialRelations

export const AlphaDiversityOptionalDefaultsWithPartialRelationsSchema: z.ZodType<AlphaDiversityOptionalDefaultsWithPartialRelations> = AlphaDiversityOptionalDefaultsSchema.merge(z.object({
  Analysis: z.lazy(() => AnalysisPartialWithRelationsSchema),
  AlphaDiversityIndexes: z.lazy(() => AlphaDiversityIndexPartialWithRelationsSchema).array(),
}).partial())

export type AlphaDiversityWithPartialRelations = z.infer<typeof AlphaDiversitySchema> & AlphaDiversityPartialRelations

export const AlphaDiversityWithPartialRelationsSchema: z.ZodType<AlphaDiversityWithPartialRelations> = AlphaDiversitySchema.merge(z.object({
  Analysis: z.lazy(() => AnalysisPartialWithRelationsSchema),
  AlphaDiversityIndexes: z.lazy(() => AlphaDiversityIndexPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// ALPHA DIVERSITY INDEX SCHEMA
/////////////////////////////////////////

export const AlphaDiversityIndexSchema = z.object({
  id: z.number().int(),
  lib_id: z.string(),
  parentId: z.number().int(),
  index: z.number(),
})

export type AlphaDiversityIndex = z.infer<typeof AlphaDiversityIndexSchema>

/////////////////////////////////////////
// ALPHA DIVERSITY INDEX PARTIAL SCHEMA
/////////////////////////////////////////

export const AlphaDiversityIndexPartialSchema = AlphaDiversityIndexSchema.partial()

export type AlphaDiversityIndexPartial = z.infer<typeof AlphaDiversityIndexPartialSchema>

// ALPHA DIVERSITY INDEX OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const AlphaDiversityIndexOptionalDefaultsSchema = AlphaDiversityIndexSchema.merge(z.object({
  id: z.number().int().optional(),
}))

export type AlphaDiversityIndexOptionalDefaults = z.infer<typeof AlphaDiversityIndexOptionalDefaultsSchema>

// ALPHA DIVERSITY INDEX RELATION SCHEMA
//------------------------------------------------------

export type AlphaDiversityIndexRelations = {
  Library: LibraryWithRelations;
  AlphaDiversity: AlphaDiversityWithRelations;
};

export type AlphaDiversityIndexWithRelations = z.infer<typeof AlphaDiversityIndexSchema> & AlphaDiversityIndexRelations

export const AlphaDiversityIndexWithRelationsSchema: z.ZodType<AlphaDiversityIndexWithRelations> = AlphaDiversityIndexSchema.merge(z.object({
  Library: z.lazy(() => LibraryWithRelationsSchema),
  AlphaDiversity: z.lazy(() => AlphaDiversityWithRelationsSchema),
}))

// ALPHA DIVERSITY INDEX OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type AlphaDiversityIndexOptionalDefaultsRelations = {
  Library: LibraryOptionalDefaultsWithRelations;
  AlphaDiversity: AlphaDiversityOptionalDefaultsWithRelations;
};

export type AlphaDiversityIndexOptionalDefaultsWithRelations = z.infer<typeof AlphaDiversityIndexOptionalDefaultsSchema> & AlphaDiversityIndexOptionalDefaultsRelations

export const AlphaDiversityIndexOptionalDefaultsWithRelationsSchema: z.ZodType<AlphaDiversityIndexOptionalDefaultsWithRelations> = AlphaDiversityIndexOptionalDefaultsSchema.merge(z.object({
  Library: z.lazy(() => LibraryOptionalDefaultsWithRelationsSchema),
  AlphaDiversity: z.lazy(() => AlphaDiversityOptionalDefaultsWithRelationsSchema),
}))

// ALPHA DIVERSITY INDEX PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type AlphaDiversityIndexPartialRelations = {
  Library?: LibraryPartialWithRelations;
  AlphaDiversity?: AlphaDiversityPartialWithRelations;
};

export type AlphaDiversityIndexPartialWithRelations = z.infer<typeof AlphaDiversityIndexPartialSchema> & AlphaDiversityIndexPartialRelations

export const AlphaDiversityIndexPartialWithRelationsSchema: z.ZodType<AlphaDiversityIndexPartialWithRelations> = AlphaDiversityIndexPartialSchema.merge(z.object({
  Library: z.lazy(() => LibraryPartialWithRelationsSchema),
  AlphaDiversity: z.lazy(() => AlphaDiversityPartialWithRelationsSchema),
})).partial()

export type AlphaDiversityIndexOptionalDefaultsWithPartialRelations = z.infer<typeof AlphaDiversityIndexOptionalDefaultsSchema> & AlphaDiversityIndexPartialRelations

export const AlphaDiversityIndexOptionalDefaultsWithPartialRelationsSchema: z.ZodType<AlphaDiversityIndexOptionalDefaultsWithPartialRelations> = AlphaDiversityIndexOptionalDefaultsSchema.merge(z.object({
  Library: z.lazy(() => LibraryPartialWithRelationsSchema),
  AlphaDiversity: z.lazy(() => AlphaDiversityPartialWithRelationsSchema),
}).partial())

export type AlphaDiversityIndexWithPartialRelations = z.infer<typeof AlphaDiversityIndexSchema> & AlphaDiversityIndexPartialRelations

export const AlphaDiversityIndexWithPartialRelationsSchema: z.ZodType<AlphaDiversityIndexWithPartialRelations> = AlphaDiversityIndexSchema.merge(z.object({
  Library: z.lazy(() => LibraryPartialWithRelationsSchema),
  AlphaDiversity: z.lazy(() => AlphaDiversityPartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// PROJECT SCHEMA
/////////////////////////////////////////

export const ProjectSchema = z.object({
  neg_cont_0_1: DeadBooleanSchema.nullish(),
  pos_cont_0_1: DeadBooleanSchema.nullish(),
  id: z.number().int(),
  project_id: z.string(),
  userIds: z.string().array(),
  dateSubmitted: z.coerce.date(),
  isPrivate: z.boolean(),
  /**
   * [UserDefinedType]
   */
  userDefined: JsonValueSchema.nullable(),
  /**
   * [EditHistoryType]
   */
  editHistory: JsonValueSchema.nullable(),
  projectMetadataFileUrl_ODE: z.string(),
  projectMetadataFileChecksum_ODE: z.string(),
  sampleMetadataFileUrl_ODE: z.string(),
  sampleMetadataFileChecksum_ODE: z.string(),
  libraryMetadataFileUrl_ODE: z.string(),
  libraryMetadataFileChecksum_ODE: z.string(),
  imageFileUrl_ODE: z.string().nullish(),
  recordedBy: z.string(),
  recordedByID: z.string().nullish(),
  project_contact: z.string(),
  institution: z.string().nullish(),
  institutionID: z.string().nullish(),
  project_name: z.string(),
  parent_project_id: z.string().nullish(),
  study_factor: z.string().nullish(),
  assay_type: z.string(),
  projectDescription: z.string().nullish(),
  dataDescription: z.string().nullish(),
  license: z.string().nullish(),
  rightsHolder: z.string().nullish(),
  accessRights: z.string().nullish(),
  informationWithheld: z.string().nullish(),
  dataGeneralizations: z.string().nullish(),
  bibliographicCitation: z.string().nullish(),
  associated_resource: z.string().nullish(),
  mod_date: z.coerce.date().nullish(),
  checkls_ver: z.string(),
  seq_archive: z.string().nullish(),
  code_repo: z.string().nullish(),
  biological_rep: z.number().int().nullish(),
  sample_type: z.string(),
})

export type Project = z.infer<typeof ProjectSchema>

/////////////////////////////////////////
// PROJECT PARTIAL SCHEMA
/////////////////////////////////////////

export const ProjectPartialSchema = ProjectSchema.partial()

export type ProjectPartial = z.infer<typeof ProjectPartialSchema>

// PROJECT OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const ProjectOptionalDefaultsSchema = ProjectSchema.merge(z.object({
  id: z.number().int().optional(),
  dateSubmitted: z.coerce.date().optional(),
}))

export type ProjectOptionalDefaults = z.infer<typeof ProjectOptionalDefaultsSchema>

// PROJECT RELATION SCHEMA
//------------------------------------------------------

export type ProjectRelations = {
  Samples: SampleWithRelations[];
  AssayPreps: AssayPrepWithRelations[];
  Libraries: LibraryWithRelations[];
  Analyses: AnalysisWithRelations[];
};

export type ProjectWithRelations = Omit<z.infer<typeof ProjectSchema>, "userDefined" | "editHistory"> & {
  userDefined?: JsonValueType | null;
  editHistory?: JsonValueType | null;
} & ProjectRelations

export const ProjectWithRelationsSchema: z.ZodType<ProjectWithRelations> = ProjectSchema.merge(z.object({
  Samples: z.lazy(() => SampleWithRelationsSchema).array(),
  AssayPreps: z.lazy(() => AssayPrepWithRelationsSchema).array(),
  Libraries: z.lazy(() => LibraryWithRelationsSchema).array(),
  Analyses: z.lazy(() => AnalysisWithRelationsSchema).array(),
}))

// PROJECT OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type ProjectOptionalDefaultsRelations = {
  Samples: SampleOptionalDefaultsWithRelations[];
  AssayPreps: AssayPrepOptionalDefaultsWithRelations[];
  Libraries: LibraryOptionalDefaultsWithRelations[];
  Analyses: AnalysisOptionalDefaultsWithRelations[];
};

export type ProjectOptionalDefaultsWithRelations = Omit<z.infer<typeof ProjectOptionalDefaultsSchema>, "userDefined" | "editHistory"> & {
  userDefined?: JsonValueType | null;
  editHistory?: JsonValueType | null;
} & ProjectOptionalDefaultsRelations

export const ProjectOptionalDefaultsWithRelationsSchema: z.ZodType<ProjectOptionalDefaultsWithRelations> = ProjectOptionalDefaultsSchema.merge(z.object({
  Samples: z.lazy(() => SampleOptionalDefaultsWithRelationsSchema).array(),
  AssayPreps: z.lazy(() => AssayPrepOptionalDefaultsWithRelationsSchema).array(),
  Libraries: z.lazy(() => LibraryOptionalDefaultsWithRelationsSchema).array(),
  Analyses: z.lazy(() => AnalysisOptionalDefaultsWithRelationsSchema).array(),
}))

// PROJECT PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type ProjectPartialRelations = {
  Samples?: SamplePartialWithRelations[];
  AssayPreps?: AssayPrepPartialWithRelations[];
  Libraries?: LibraryPartialWithRelations[];
  Analyses?: AnalysisPartialWithRelations[];
};

export type ProjectPartialWithRelations = Omit<z.infer<typeof ProjectPartialSchema>, "userDefined" | "editHistory"> & {
  userDefined?: JsonValueType | null;
  editHistory?: JsonValueType | null;
} & ProjectPartialRelations

export const ProjectPartialWithRelationsSchema: z.ZodType<ProjectPartialWithRelations> = ProjectPartialSchema.merge(z.object({
  Samples: z.lazy(() => SamplePartialWithRelationsSchema).array(),
  AssayPreps: z.lazy(() => AssayPrepPartialWithRelationsSchema).array(),
  Libraries: z.lazy(() => LibraryPartialWithRelationsSchema).array(),
  Analyses: z.lazy(() => AnalysisPartialWithRelationsSchema).array(),
})).partial()

export type ProjectOptionalDefaultsWithPartialRelations = Omit<z.infer<typeof ProjectOptionalDefaultsSchema>, "userDefined" | "editHistory"> & {
  userDefined?: JsonValueType | null;
  editHistory?: JsonValueType | null;
} & ProjectPartialRelations

export const ProjectOptionalDefaultsWithPartialRelationsSchema: z.ZodType<ProjectOptionalDefaultsWithPartialRelations> = ProjectOptionalDefaultsSchema.merge(z.object({
  Samples: z.lazy(() => SamplePartialWithRelationsSchema).array(),
  AssayPreps: z.lazy(() => AssayPrepPartialWithRelationsSchema).array(),
  Libraries: z.lazy(() => LibraryPartialWithRelationsSchema).array(),
  Analyses: z.lazy(() => AnalysisPartialWithRelationsSchema).array(),
}).partial())

export type ProjectWithPartialRelations = Omit<z.infer<typeof ProjectSchema>, "userDefined" | "editHistory"> & {
  userDefined?: JsonValueType | null;
  editHistory?: JsonValueType | null;
} & ProjectPartialRelations

export const ProjectWithPartialRelationsSchema: z.ZodType<ProjectWithPartialRelations> = ProjectSchema.merge(z.object({
  Samples: z.lazy(() => SamplePartialWithRelationsSchema).array(),
  AssayPreps: z.lazy(() => AssayPrepPartialWithRelationsSchema).array(),
  Libraries: z.lazy(() => LibraryPartialWithRelationsSchema).array(),
  Analyses: z.lazy(() => AnalysisPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// SAMPLE SCHEMA
/////////////////////////////////////////

export const SampleSchema = z.object({
  habitat_natural_artificial_0_1: DeadBooleanSchema.nullish(),
  filter_passive_active_0_1: DeadBooleanSchema.nullish(),
  dna_cleanup_0_1: DeadBooleanSchema.nullish(),
  id: z.number().int(),
  samp_name: z.string(),
  biosample_accession: z.string().nullish(),
  /**
   * [UserDefinedType]
   */
  userDefined: JsonValueSchema.nullable(),
  project_id: z.string(),
  deleted_ODE: z.boolean().nullish(),
  samp_category: z.string(),
  neg_cont_type: z.string().nullish(),
  pos_cont_type: z.string().nullish(),
  decimalLatitude: z.number().nullish(),
  decimalLongitude: z.number().nullish(),
  verbatimLatitude: z.string().nullish(),
  verbatimLongitude: z.string().nullish(),
  verbatimCoordinateSystem: z.string().nullish(),
  verbatimSRS: z.string().nullish(),
  geo_loc_name: z.string(),
  eventDate: z.coerce.date(),
  eventDate_Midpoint_ODE: z.coerce.date().nullish(),
  eventDate_End_ODE: z.coerce.date().nullish(),
  eventDurationValue: z.string().nullish(),
  eventDurationUnit: z.string().nullish(),
  verbatimEventDate: z.string().nullish(),
  verbatimEventTime: z.string().nullish(),
  verbatimDateEnd: z.string().nullish(),
  verbatimTimeEnd: z.string().nullish(),
  env_broad_scale: z.string().nullish(),
  env_local_scale: z.string().nullish(),
  env_medium: z.string().nullish(),
  samp_collect_method: z.string().nullish(),
  samp_collect_device: z.string().nullish(),
  samp_size: z.number().nullish(),
  samp_size_unit: z.string().nullish(),
  serial_number: z.string().nullish(),
  line_id: z.string().nullish(),
  station_id: z.string().nullish(),
  ctd_cast_number: z.string().nullish(),
  ctd_bottle_number: z.string().nullish(),
  replicate_number: z.string().nullish(),
  samp_collect_notes: z.string().nullish(),
  samp_store_temp: z.number().nullish(),
  samp_store_sol: z.string().nullish(),
  samp_store_dur: z.string().nullish(),
  samp_store_method_additional: z.string().nullish(),
  dna_store_loc: z.string().nullish(),
  samp_store_loc: z.string().nullish(),
  samp_mat_process: z.string().nullish(),
  filter_onsite_dur: z.string().nullish(),
  size_frac_low: z.string().nullish(),
  size_frac: z.number().nullish(),
  filter_diameter: z.number().nullish(),
  filter_surface_area: z.number().nullish(),
  filter_material: z.string().nullish(),
  filter_name: z.string().nullish(),
  precip_chem_prep: z.string().nullish(),
  precip_force_prep: z.number().nullish(),
  precip_time_prep: z.number().nullish(),
  precip_temp_prep: z.number().nullish(),
  prepped_samp_store_temp: z.string().nullish(),
  prepped_samp_store_sol: z.string().nullish(),
  prepped_samp_store_dur: z.string().nullish(),
  prep_method_additional: z.string().nullish(),
  prefilter_material: z.string().nullish(),
  pump_flow_rate: z.number().nullish(),
  pump_flow_rate_unit: z.string().nullish(),
  stationed_sample_dur: z.string().nullish(),
  extract_id: z.string().nullish(),
  extract_plate: z.string().nullish(),
  extract_well_number: z.number().int().nullish(),
  extract_well_position: z.string().nullish(),
  materialSampleID: z.string().nullish(),
  sample_derived_from: z.string().nullish(),
  sample_composed_of: z.string().nullish(),
  rel_cont_id: z.string().nullish(),
  biological_rep_relation: z.string().nullish(),
  samp_vol_we_dna_ext: z.number().nullish(),
  samp_vol_we_dna_ext_unit: z.string().nullish(),
  nucl_acid_ext_lysis: z.string().nullish(),
  nucl_acid_ext_sep: z.string().nullish(),
  nucl_acid_ext: z.string().nullish(),
  nucl_acid_ext_kit: z.string().nullish(),
  nucl_acid_ext_modify: z.string().nullish(),
  dna_cleanup_method: z.string().nullish(),
  concentration: z.number().nullish(),
  concentration_method: z.string().nullish(),
  ratioOfAbsorbance260_280: z.number().nullish(),
  pool_dna_num: z.number().int().nullish(),
  nucl_acid_ext_method_additional: z.string().nullish(),
  concentration_unit: z.string().nullish(),
  date_ext: z.coerce.date().nullish(),
  dna_yield: z.number().nullish(),
  dna_yield_unit: z.string().nullish(),
  samp_weather: z.string().nullish(),
  minimumDepthInMeters: z.number().nullish(),
  maximumDepthInMeters: z.number().nullish(),
  tot_depth_water_col: z.number().nullish(),
  elev: z.number().nullish(),
  temp: z.number().nullish(),
  chlorophyll: z.number().nullish(),
  light_intensity: z.number().nullish(),
  misc_param: z.number().nullish(),
  ph: z.number().nullish(),
  ph_meth: z.string().nullish(),
  salinity: z.number().nullish(),
  suspend_part_matter: z.number().nullish(),
  tidal_stage: z.string().nullish(),
  turbidity: z.number().nullish(),
  water_current: z.number().nullish(),
  solar_irradiance: z.string().nullish(),
  wind_direction: z.string().nullish(),
  wind_speed: z.number().nullish(),
  diss_inorg_carb: z.number().nullish(),
  diss_inorg_nitro: z.number().nullish(),
  diss_org_carb: z.number().nullish(),
  diss_org_nitro: z.number().nullish(),
  diss_oxygen: z.number().nullish(),
  tot_diss_nitro: z.number().nullish(),
  tot_inorg_nitro: z.number().nullish(),
  tot_nitro: z.number().nullish(),
  tot_part_carb: z.number().nullish(),
  tot_org_carb: z.number().nullish(),
  tot_org_c_meth: z.number().nullish(),
  tot_nitro_content: z.number().nullish(),
  tot_nitro_cont_meth: z.number().nullish(),
  tot_carb: z.number().nullish(),
  part_org_carb: z.number().nullish(),
  part_org_nitro: z.number().nullish(),
  nitrate: z.number().nullish(),
  nitrite: z.number().nullish(),
  nitro: z.number().nullish(),
  org_carb: z.number().nullish(),
  org_matter: z.number().nullish(),
  org_nitro: z.number().nullish(),
  diss_inorg_carb_unit: z.string().nullish(),
  diss_inorg_nitro_unit: z.string().nullish(),
  diss_org_carb_unit: z.string().nullish(),
  diss_org_nitro_unit: z.string().nullish(),
  diss_oxygen_unit: z.string().nullish(),
  nitrate_unit: z.string().nullish(),
  nitrite_unit: z.string().nullish(),
  nitro_unit: z.string().nullish(),
  org_carb_unit: z.string().nullish(),
  org_matter_unit: z.string().nullish(),
  org_nitro_unit: z.string().nullish(),
  part_org_carb_unit: z.string().nullish(),
  part_org_nitro_unit: z.string().nullish(),
  tot_carb_unit: z.string().nullish(),
  tot_diss_nitro_unit: z.string().nullish(),
  tot_inorg_nitro_unit: z.string().nullish(),
  tot_nitro_content_unit: z.string().nullish(),
  tot_nitro_unit: z.string().nullish(),
  tot_org_carb_unit: z.string().nullish(),
  tot_part_carb_unit: z.string().nullish(),
  ammonium: z.string().nullish(),
  ammonium_unit: z.string().nullish(),
  carbonate: z.number().nullish(),
  carbonate_unit: z.string().nullish(),
  hydrogen_ion: z.number().nullish(),
  nitrate_plus_nitrite: z.number().nullish(),
  nitrate_plus_nitrite_unit: z.string().nullish(),
  omega_arag: z.number().nullish(),
  pco2: z.number().int().nullish(),
  pco2_unit: z.string().nullish(),
  phosphate: z.number().nullish(),
  phosphate_unit: z.string().nullish(),
  pressure: z.number().int().nullish(),
  pressure_unit: z.string().nullish(),
  silicate: z.number().nullish(),
  silicate_unit: z.string().nullish(),
  tot_alkalinity: z.number().nullish(),
  tot_alkalinity_unit: z.string().nullish(),
  transmittance: z.number().nullish(),
  transmittance_unit: z.string().nullish(),
  organism: z.string().nullish(),
  sterilise_method: z.string().nullish(),
  short_name: z.string(),
  expedition_id: z.string(),
  ship_crs_expocode: z.string().nullish(),
  woce_sect: z.string().nullish(),
  bioproject_accession: z.string().nullish(),
})

export type Sample = z.infer<typeof SampleSchema>

/////////////////////////////////////////
// SAMPLE PARTIAL SCHEMA
/////////////////////////////////////////

export const SamplePartialSchema = SampleSchema.partial()

export type SamplePartial = z.infer<typeof SamplePartialSchema>

// SAMPLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const SampleOptionalDefaultsSchema = SampleSchema.merge(z.object({
  id: z.number().int().optional(),
}))

export type SampleOptionalDefaults = z.infer<typeof SampleOptionalDefaultsSchema>

// SAMPLE RELATION SCHEMA
//------------------------------------------------------

export type SampleRelations = {
  Project: ProjectWithRelations;
  Libraries: LibraryWithRelations[];
};

export type SampleWithRelations = Omit<z.infer<typeof SampleSchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & SampleRelations

export const SampleWithRelationsSchema: z.ZodType<SampleWithRelations> = SampleSchema.merge(z.object({
  Project: z.lazy(() => ProjectWithRelationsSchema),
  Libraries: z.lazy(() => LibraryWithRelationsSchema).array(),
}))

// SAMPLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type SampleOptionalDefaultsRelations = {
  Project: ProjectOptionalDefaultsWithRelations;
  Libraries: LibraryOptionalDefaultsWithRelations[];
};

export type SampleOptionalDefaultsWithRelations = Omit<z.infer<typeof SampleOptionalDefaultsSchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & SampleOptionalDefaultsRelations

export const SampleOptionalDefaultsWithRelationsSchema: z.ZodType<SampleOptionalDefaultsWithRelations> = SampleOptionalDefaultsSchema.merge(z.object({
  Project: z.lazy(() => ProjectOptionalDefaultsWithRelationsSchema),
  Libraries: z.lazy(() => LibraryOptionalDefaultsWithRelationsSchema).array(),
}))

// SAMPLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type SamplePartialRelations = {
  Project?: ProjectPartialWithRelations;
  Libraries?: LibraryPartialWithRelations[];
};

export type SamplePartialWithRelations = Omit<z.infer<typeof SamplePartialSchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & SamplePartialRelations

export const SamplePartialWithRelationsSchema: z.ZodType<SamplePartialWithRelations> = SamplePartialSchema.merge(z.object({
  Project: z.lazy(() => ProjectPartialWithRelationsSchema),
  Libraries: z.lazy(() => LibraryPartialWithRelationsSchema).array(),
})).partial()

export type SampleOptionalDefaultsWithPartialRelations = Omit<z.infer<typeof SampleOptionalDefaultsSchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & SamplePartialRelations

export const SampleOptionalDefaultsWithPartialRelationsSchema: z.ZodType<SampleOptionalDefaultsWithPartialRelations> = SampleOptionalDefaultsSchema.merge(z.object({
  Project: z.lazy(() => ProjectPartialWithRelationsSchema),
  Libraries: z.lazy(() => LibraryPartialWithRelationsSchema).array(),
}).partial())

export type SampleWithPartialRelations = Omit<z.infer<typeof SampleSchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & SamplePartialRelations

export const SampleWithPartialRelationsSchema: z.ZodType<SampleWithPartialRelations> = SampleSchema.merge(z.object({
  Project: z.lazy(() => ProjectPartialWithRelationsSchema),
  Libraries: z.lazy(() => LibraryPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// ASSAY SCHEMA
/////////////////////////////////////////

export const AssaySchema = z.object({
  id: z.number().int(),
  assay_name: z.string(),
  pcr_primer_forward: z.string(),
  pcr_primer_reverse: z.string(),
  pcr_primer_name_forward: z.string(),
  pcr_primer_name_reverse: z.string(),
  assay_name_alternate: z.string().nullish(),
  targetTaxonomicAssay: z.string(),
  targetTaxonomicScope: z.string().nullish(),
  target: z.string().nullish(),
  target_gene: z.string(),
  target_subfragment: z.string().nullish(),
  pcr_primer_name_published_forward: z.string().nullish(),
  pcr_primer_name_published_reverse: z.string().nullish(),
  pcr_primer_reference_forward: z.string().nullish(),
  pcr_primer_reference_reverse: z.string().nullish(),
  assay_reference: z.string().nullish(),
})

export type Assay = z.infer<typeof AssaySchema>

/////////////////////////////////////////
// ASSAY PARTIAL SCHEMA
/////////////////////////////////////////

export const AssayPartialSchema = AssaySchema.partial()

export type AssayPartial = z.infer<typeof AssayPartialSchema>

// ASSAY OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const AssayOptionalDefaultsSchema = AssaySchema.merge(z.object({
  id: z.number().int().optional(),
}))

export type AssayOptionalDefaults = z.infer<typeof AssayOptionalDefaultsSchema>

// ASSAY RELATION SCHEMA
//------------------------------------------------------

export type AssayRelations = {
  AssayPreps: AssayPrepWithRelations[];
  Libraries: LibraryWithRelations[];
  Analyses: AnalysisWithRelations[];
};

export type AssayWithRelations = z.infer<typeof AssaySchema> & AssayRelations

export const AssayWithRelationsSchema: z.ZodType<AssayWithRelations> = AssaySchema.merge(z.object({
  AssayPreps: z.lazy(() => AssayPrepWithRelationsSchema).array(),
  Libraries: z.lazy(() => LibraryWithRelationsSchema).array(),
  Analyses: z.lazy(() => AnalysisWithRelationsSchema).array(),
}))

// ASSAY OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type AssayOptionalDefaultsRelations = {
  AssayPreps: AssayPrepOptionalDefaultsWithRelations[];
  Libraries: LibraryOptionalDefaultsWithRelations[];
  Analyses: AnalysisOptionalDefaultsWithRelations[];
};

export type AssayOptionalDefaultsWithRelations = z.infer<typeof AssayOptionalDefaultsSchema> & AssayOptionalDefaultsRelations

export const AssayOptionalDefaultsWithRelationsSchema: z.ZodType<AssayOptionalDefaultsWithRelations> = AssayOptionalDefaultsSchema.merge(z.object({
  AssayPreps: z.lazy(() => AssayPrepOptionalDefaultsWithRelationsSchema).array(),
  Libraries: z.lazy(() => LibraryOptionalDefaultsWithRelationsSchema).array(),
  Analyses: z.lazy(() => AnalysisOptionalDefaultsWithRelationsSchema).array(),
}))

// ASSAY PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type AssayPartialRelations = {
  AssayPreps?: AssayPrepPartialWithRelations[];
  Libraries?: LibraryPartialWithRelations[];
  Analyses?: AnalysisPartialWithRelations[];
};

export type AssayPartialWithRelations = z.infer<typeof AssayPartialSchema> & AssayPartialRelations

export const AssayPartialWithRelationsSchema: z.ZodType<AssayPartialWithRelations> = AssayPartialSchema.merge(z.object({
  AssayPreps: z.lazy(() => AssayPrepPartialWithRelationsSchema).array(),
  Libraries: z.lazy(() => LibraryPartialWithRelationsSchema).array(),
  Analyses: z.lazy(() => AnalysisPartialWithRelationsSchema).array(),
})).partial()

export type AssayOptionalDefaultsWithPartialRelations = z.infer<typeof AssayOptionalDefaultsSchema> & AssayPartialRelations

export const AssayOptionalDefaultsWithPartialRelationsSchema: z.ZodType<AssayOptionalDefaultsWithPartialRelations> = AssayOptionalDefaultsSchema.merge(z.object({
  AssayPreps: z.lazy(() => AssayPrepPartialWithRelationsSchema).array(),
  Libraries: z.lazy(() => LibraryPartialWithRelationsSchema).array(),
  Analyses: z.lazy(() => AnalysisPartialWithRelationsSchema).array(),
}).partial())

export type AssayWithPartialRelations = z.infer<typeof AssaySchema> & AssayPartialRelations

export const AssayWithPartialRelationsSchema: z.ZodType<AssayWithPartialRelations> = AssaySchema.merge(z.object({
  AssayPreps: z.lazy(() => AssayPrepPartialWithRelationsSchema).array(),
  Libraries: z.lazy(() => LibraryPartialWithRelationsSchema).array(),
  Analyses: z.lazy(() => AnalysisPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// ASSAY PREP SCHEMA
/////////////////////////////////////////

export const AssayPrepSchema = z.object({
  pcr_0_1: DeadBooleanSchema,
  id: z.number().int(),
  project_id: z.string(),
  assay_name: z.string(),
  thermocycler: z.string().nullish(),
  commercial_mm: z.string().nullish(),
  custom_mm: z.string().nullish(),
  pcr_cond: z.string().nullish(),
  nucl_acid_amp: z.string().nullish(),
  amplificationReactionVolume: z.number().nullish(),
  assay_validation: z.string().nullish(),
  pcr_primer_vol_forward: z.number().nullish(),
  pcr_primer_vol_reverse: z.number().nullish(),
  pcr_primer_conc_forward: z.number().nullish(),
  pcr_primer_conc_reverse: z.number().nullish(),
  probeReporter: z.string().nullish(),
  probeQuencher: z.string().nullish(),
  probe_seq: z.string().nullish(),
  probe_ref: z.string().nullish(),
  probe_conc: z.number().nullish(),
  pcr_dna_vol: z.number().nullish(),
  pcr_rep: z.number().int().nullish(),
  annealingTemp: z.string().nullish(),
  pcr_cycles: z.number().nullish(),
  pcr_analysis_software: z.string().nullish(),
  pcr_method_additional: z.string().nullish(),
  assay_type: z.string(),
  ampliconSize: z.number().nullish(),
  ampliconSize_Midpoint_ODE: z.number().nullish(),
  ampliconSize_End_ODE: z.number().nullish(),
})

export type AssayPrep = z.infer<typeof AssayPrepSchema>

/////////////////////////////////////////
// ASSAY PREP PARTIAL SCHEMA
/////////////////////////////////////////

export const AssayPrepPartialSchema = AssayPrepSchema.partial()

export type AssayPrepPartial = z.infer<typeof AssayPrepPartialSchema>

// ASSAY PREP OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const AssayPrepOptionalDefaultsSchema = AssayPrepSchema.merge(z.object({
  id: z.number().int().optional(),
}))

export type AssayPrepOptionalDefaults = z.infer<typeof AssayPrepOptionalDefaultsSchema>

// ASSAY PREP RELATION SCHEMA
//------------------------------------------------------

export type AssayPrepRelations = {
  Project: ProjectWithRelations;
  Assay: AssayWithRelations;
  Libraries: LibraryWithRelations[];
};

export type AssayPrepWithRelations = z.infer<typeof AssayPrepSchema> & AssayPrepRelations

export const AssayPrepWithRelationsSchema: z.ZodType<AssayPrepWithRelations> = AssayPrepSchema.merge(z.object({
  Project: z.lazy(() => ProjectWithRelationsSchema),
  Assay: z.lazy(() => AssayWithRelationsSchema),
  Libraries: z.lazy(() => LibraryWithRelationsSchema).array(),
}))

// ASSAY PREP OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type AssayPrepOptionalDefaultsRelations = {
  Project: ProjectOptionalDefaultsWithRelations;
  Assay: AssayOptionalDefaultsWithRelations;
  Libraries: LibraryOptionalDefaultsWithRelations[];
};

export type AssayPrepOptionalDefaultsWithRelations = z.infer<typeof AssayPrepOptionalDefaultsSchema> & AssayPrepOptionalDefaultsRelations

export const AssayPrepOptionalDefaultsWithRelationsSchema: z.ZodType<AssayPrepOptionalDefaultsWithRelations> = AssayPrepOptionalDefaultsSchema.merge(z.object({
  Project: z.lazy(() => ProjectOptionalDefaultsWithRelationsSchema),
  Assay: z.lazy(() => AssayOptionalDefaultsWithRelationsSchema),
  Libraries: z.lazy(() => LibraryOptionalDefaultsWithRelationsSchema).array(),
}))

// ASSAY PREP PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type AssayPrepPartialRelations = {
  Project?: ProjectPartialWithRelations;
  Assay?: AssayPartialWithRelations;
  Libraries?: LibraryPartialWithRelations[];
};

export type AssayPrepPartialWithRelations = z.infer<typeof AssayPrepPartialSchema> & AssayPrepPartialRelations

export const AssayPrepPartialWithRelationsSchema: z.ZodType<AssayPrepPartialWithRelations> = AssayPrepPartialSchema.merge(z.object({
  Project: z.lazy(() => ProjectPartialWithRelationsSchema),
  Assay: z.lazy(() => AssayPartialWithRelationsSchema),
  Libraries: z.lazy(() => LibraryPartialWithRelationsSchema).array(),
})).partial()

export type AssayPrepOptionalDefaultsWithPartialRelations = z.infer<typeof AssayPrepOptionalDefaultsSchema> & AssayPrepPartialRelations

export const AssayPrepOptionalDefaultsWithPartialRelationsSchema: z.ZodType<AssayPrepOptionalDefaultsWithPartialRelations> = AssayPrepOptionalDefaultsSchema.merge(z.object({
  Project: z.lazy(() => ProjectPartialWithRelationsSchema),
  Assay: z.lazy(() => AssayPartialWithRelationsSchema),
  Libraries: z.lazy(() => LibraryPartialWithRelationsSchema).array(),
}).partial())

export type AssayPrepWithPartialRelations = z.infer<typeof AssayPrepSchema> & AssayPrepPartialRelations

export const AssayPrepWithPartialRelationsSchema: z.ZodType<AssayPrepWithPartialRelations> = AssayPrepSchema.merge(z.object({
  Project: z.lazy(() => ProjectPartialWithRelationsSchema),
  Assay: z.lazy(() => AssayPartialWithRelationsSchema),
  Libraries: z.lazy(() => LibraryPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// LIBRARY SCHEMA
/////////////////////////////////////////

export const LibrarySchema = z.object({
  inhibition_check_0_1: DeadBooleanSchema.nullish(),
  id: z.number().int(),
  lib_id: z.string(),
  /**
   * [UserDefinedType]
   */
  userDefined: JsonValueSchema.nullable(),
  project_id: z.string(),
  samp_name: z.string(),
  assay_name: z.string(),
  barcoding_pcr_appr: z.string().nullish(),
  platform: z.string().nullish(),
  instrument: z.string().nullish(),
  seq_kit: z.string().nullish(),
  lib_layout: z.string().nullish(),
  sequencing_location: z.string().nullish(),
  adapter_forward: z.string().nullish(),
  adapter_reverse: z.string().nullish(),
  lib_screen: z.string().nullish(),
  seq_method_additional: z.string().nullish(),
  mid_forward: z.string().nullish(),
  mid_reverse: z.string().nullish(),
  filename: z.string().nullish(),
  filename2: z.string().nullish(),
  seq_run_id: z.string(),
  input_read_count: z.number().int().nullish(),
  checksum_filename: z.string().nullish(),
  checksum_filename2: z.string().nullish(),
  lib_conc: z.number().nullish(),
  lib_conc_meth: z.string().nullish(),
  lib_conc_unit: z.string().nullish(),
  phix_perc: z.number().nullish(),
  checksum_method: z.string().nullish(),
  pcr2_amplificationReactionVolume: z.number().nullish(),
  pcr2_analysis_software: z.string().nullish(),
  pcr2_annealingTemp: z.number().nullish(),
  pcr2_commercial_mm: z.string().nullish(),
  pcr2_cond: z.string().nullish(),
  pcr2_custom_mm: z.string().nullish(),
  pcr2_cycles: z.number().int().nullish(),
  pcr2_dna_vol: z.number().nullish(),
  pcr2_method_additional: z.string().nullish(),
  pcr2_plate_id: z.string().nullish(),
  pcr2_thermocycler: z.string().nullish(),
  associatedSequences: z.string().nullish(),
  pcr_plate_id: z.string().nullish(),
  block_ref: z.string().nullish(),
  block_seq: z.string().nullish(),
  block_taxa: z.string().nullish(),
  inhibition_check: z.string().nullish(),
})

export type Library = z.infer<typeof LibrarySchema>

/////////////////////////////////////////
// LIBRARY PARTIAL SCHEMA
/////////////////////////////////////////

export const LibraryPartialSchema = LibrarySchema.partial()

export type LibraryPartial = z.infer<typeof LibraryPartialSchema>

// LIBRARY OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const LibraryOptionalDefaultsSchema = LibrarySchema.merge(z.object({
  id: z.number().int().optional(),
}))

export type LibraryOptionalDefaults = z.infer<typeof LibraryOptionalDefaultsSchema>

// LIBRARY RELATION SCHEMA
//------------------------------------------------------

export type LibraryRelations = {
  Project: ProjectWithRelations;
  Sample: SampleWithRelations;
  Assay: AssayWithRelations;
  AssayPrep: AssayPrepWithRelations;
  Occurrences: OccurrenceWithRelations[];
  AlphaDiversityIndexes: AlphaDiversityIndexWithRelations[];
};

export type LibraryWithRelations = Omit<z.infer<typeof LibrarySchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & LibraryRelations

export const LibraryWithRelationsSchema: z.ZodType<LibraryWithRelations> = LibrarySchema.merge(z.object({
  Project: z.lazy(() => ProjectWithRelationsSchema),
  Sample: z.lazy(() => SampleWithRelationsSchema),
  Assay: z.lazy(() => AssayWithRelationsSchema),
  AssayPrep: z.lazy(() => AssayPrepWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrenceWithRelationsSchema).array(),
  AlphaDiversityIndexes: z.lazy(() => AlphaDiversityIndexWithRelationsSchema).array(),
}))

// LIBRARY OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type LibraryOptionalDefaultsRelations = {
  Project: ProjectOptionalDefaultsWithRelations;
  Sample: SampleOptionalDefaultsWithRelations;
  Assay: AssayOptionalDefaultsWithRelations;
  AssayPrep: AssayPrepOptionalDefaultsWithRelations;
  Occurrences: OccurrenceOptionalDefaultsWithRelations[];
  AlphaDiversityIndexes: AlphaDiversityIndexOptionalDefaultsWithRelations[];
};

export type LibraryOptionalDefaultsWithRelations = Omit<z.infer<typeof LibraryOptionalDefaultsSchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & LibraryOptionalDefaultsRelations

export const LibraryOptionalDefaultsWithRelationsSchema: z.ZodType<LibraryOptionalDefaultsWithRelations> = LibraryOptionalDefaultsSchema.merge(z.object({
  Project: z.lazy(() => ProjectOptionalDefaultsWithRelationsSchema),
  Sample: z.lazy(() => SampleOptionalDefaultsWithRelationsSchema),
  Assay: z.lazy(() => AssayOptionalDefaultsWithRelationsSchema),
  AssayPrep: z.lazy(() => AssayPrepOptionalDefaultsWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrenceOptionalDefaultsWithRelationsSchema).array(),
  AlphaDiversityIndexes: z.lazy(() => AlphaDiversityIndexOptionalDefaultsWithRelationsSchema).array(),
}))

// LIBRARY PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type LibraryPartialRelations = {
  Project?: ProjectPartialWithRelations;
  Sample?: SamplePartialWithRelations;
  Assay?: AssayPartialWithRelations;
  AssayPrep?: AssayPrepPartialWithRelations;
  Occurrences?: OccurrencePartialWithRelations[];
  AlphaDiversityIndexes?: AlphaDiversityIndexPartialWithRelations[];
};

export type LibraryPartialWithRelations = Omit<z.infer<typeof LibraryPartialSchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & LibraryPartialRelations

export const LibraryPartialWithRelationsSchema: z.ZodType<LibraryPartialWithRelations> = LibraryPartialSchema.merge(z.object({
  Project: z.lazy(() => ProjectPartialWithRelationsSchema),
  Sample: z.lazy(() => SamplePartialWithRelationsSchema),
  Assay: z.lazy(() => AssayPartialWithRelationsSchema),
  AssayPrep: z.lazy(() => AssayPrepPartialWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrencePartialWithRelationsSchema).array(),
  AlphaDiversityIndexes: z.lazy(() => AlphaDiversityIndexPartialWithRelationsSchema).array(),
})).partial()

export type LibraryOptionalDefaultsWithPartialRelations = Omit<z.infer<typeof LibraryOptionalDefaultsSchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & LibraryPartialRelations

export const LibraryOptionalDefaultsWithPartialRelationsSchema: z.ZodType<LibraryOptionalDefaultsWithPartialRelations> = LibraryOptionalDefaultsSchema.merge(z.object({
  Project: z.lazy(() => ProjectPartialWithRelationsSchema),
  Sample: z.lazy(() => SamplePartialWithRelationsSchema),
  Assay: z.lazy(() => AssayPartialWithRelationsSchema),
  AssayPrep: z.lazy(() => AssayPrepPartialWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrencePartialWithRelationsSchema).array(),
  AlphaDiversityIndexes: z.lazy(() => AlphaDiversityIndexPartialWithRelationsSchema).array(),
}).partial())

export type LibraryWithPartialRelations = Omit<z.infer<typeof LibrarySchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & LibraryPartialRelations

export const LibraryWithPartialRelationsSchema: z.ZodType<LibraryWithPartialRelations> = LibrarySchema.merge(z.object({
  Project: z.lazy(() => ProjectPartialWithRelationsSchema),
  Sample: z.lazy(() => SamplePartialWithRelationsSchema),
  Assay: z.lazy(() => AssayPartialWithRelationsSchema),
  AssayPrep: z.lazy(() => AssayPrepPartialWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrencePartialWithRelationsSchema).array(),
  AlphaDiversityIndexes: z.lazy(() => AlphaDiversityIndexPartialWithRelationsSchema).array(),
}).partial())
