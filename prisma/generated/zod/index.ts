import { z } from 'zod';
import { Prisma } from '@/app/generated/prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.DbNull;
  if (v === 'JsonNull') return Prisma.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.lazy(() => JsonValueSchema.optional())),
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
    z.object({ toJSON: z.function(z.tuple([]), z.any()) }),
    z.record(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const AnalysisScalarFieldEnumSchema = z.enum(['id','analysis_run_name','dateSubmitted','isPrivate','editHistory','project_id','assay_name','sop_bioinformatics','trim_method','trim_param','demux_tool','demux_max_mismatch','merge_tool','merge_min_overlap','min_len_cutoff','min_len_tool','error_rate_tool','error_rate_type','error_rate_cutoff','chimera_check_method','chimera_check_param','otu_clust_tool','otu_clust_cutoff','min_reads_cutoff','min_reads_cutoff_unit','min_reads_tool','otu_db','otu_db_custom','tax_assign_cat','otu_seq_comp_appr','tax_class_id_cutoff','tax_class_query_cutoff','tax_class_collapse','tax_class_other','screen_contam_method','screen_geograph_method','screen_nontarget_method','screen_other','bioinfo_method_additional','asv_method','dada2_trunc_len_f','dada2pe_trunc_len_r','dada2_trim_left_f','dada2pe_trim_left_r','dada2_max_ee_f','dada2pe_max_ee_r','dada2_trunc_q','dada2_pooling_method','dada2_chimera_method','dada2_min_fold_parent_over_abundance','dada2_n_reads_learn','deblur_trim_length','deblur_mean_error','deblur_indel_prob','deblur_indel_max','deblur_min_reads','deblur_min_size','repseqs_min_length','repseqs_max_length','repseqs_min_abundance','repseqs_min_prevalence','discard_untrimmed','otu_num_tax_assigned','output_otu_num','output_read_count','otu_final_description','otu_raw_description','qiime2_version','tourmaline_asv_method','skl_confidence','min_consensus','tourmaline_classify_method','blca_confidence','percent_match','percent_query_cover']);

export const RelationLoadStrategySchema = z.enum(['query','join']);

export const OccurrenceScalarFieldEnumSchema = z.enum(['id','samp_name','analysis_run_name','featureid','organismQuantity']);

export const AssignmentScalarFieldEnumSchema = z.enum(['id','analysis_run_name','featureid','taxonomy','Confidence']);

export const FeatureScalarFieldEnumSchema = z.enum(['id','featureid','dna_sequence','sequenceLength']);

export const TaxonomyScalarFieldEnumSchema = z.enum(['id','taxonomy','verbatimIdentification','domain','kingdom','supergroup','division','subdivision','phylum','class','order','family','genus','species']);

export const ProjectScalarFieldEnumSchema = z.enum(['id','project_id','userIds','dateSubmitted','isPrivate','userDefined','editHistory','recordedBy','recordedByID','project_contact','institution','institutionID','project_name','parent_project_id','study_factor','assay_type','neg_cont_0_1','pos_cont_0_1','expedition_id','ship_crs_expocode','woce_sect','bioproject_accession','license','rightsHolder','accessRights','informationWithheld','dataGeneralizations','bibliographicCitation','associated_resource','mod_date','checkls_ver','seq_archive','code_repo','biological_rep']);

export const SampleScalarFieldEnumSchema = z.enum(['id','samp_name','userDefined','project_id','samp_category','neg_cont_type','pos_cont_type','decimalLatitude','decimalLongitude','verbatimLatitude','verbatimLongitude','verbatimCoordinateSystem','verbatimSRS','geo_loc_name','eventDate','eventDurationValue','eventDurationUnit','verbatimEventDate','verbatimEventTime','verbatimDateEnd','verbatimTimeEnd','env_broad_scale','env_local_scale','env_medium','habitat_natural_artificial_0_1','samp_collect_method','samp_collect_device','samp_size','samp_size_unit','serial_number','line_id','station_id','ctd_cast_number','ctd_bottle_number','replicate_number','samp_collect_notes','samp_store_temp','samp_store_sol','samp_store_dur','samp_store_method_additional','dna_store_loc','samp_store_loc','samp_mat_process','filter_passive_active_0_1','filter_onsite_dur','size_frac_low','size_frac','filter_diameter','filter_surface_area','filter_material','filter_name','precip_chem_prep','precip_force_prep','precip_time_prep','precip_temp_prep','prepped_samp_store_temp','prepped_samp_store_sol','prepped_samp_store_dur','prep_method_additional','prefilter_material','pump_flow_rate','pump_flow_rate_unit','stationed_sample_dur','extract_id','extract_plate','extract_well_number','extract_well_position','materialSampleID','sample_derived_from','sample_composed_of','rel_cont_id','biological_rep_relation','samp_vol_we_dna_ext','samp_vol_we_dna_ext_unit','nucl_acid_ext_lysis','nucl_acid_ext_sep','nucl_acid_ext','nucl_acid_ext_kit','nucl_acid_ext_modify','dna_cleanup_0_1','dna_cleanup_method','concentration','concentration_method','ratioOfAbsorbance260_280','pool_dna_num','nucl_acid_ext_method_additional','concentration_unit','date_ext','dna_yield','dna_yield_unit','samp_weather','minimumDepthInMeters','maximumDepthInMeters','tot_depth_water_col','elev','temp','chlorophyll','light_intensity','misc_param','ph','ph_meth','salinity','suspend_part_matter','tidal_stage','turbidity','water_current','solar_irradiance','wind_direction','wind_speed','diss_inorg_carb','diss_inorg_nitro','diss_org_carb','diss_org_nitro','diss_oxygen','tot_diss_nitro','tot_inorg_nitro','tot_nitro','tot_part_carb','tot_org_carb','tot_org_c_meth','tot_nitro_content','tot_nitro_cont_meth','tot_carb','part_org_carb','part_org_nitro','nitrate','nitrite','nitro','org_carb','org_matter','org_nitro','diss_inorg_carb_unit','diss_inorg_nitro_unit','diss_org_carb_unit','diss_org_nitro_unit','diss_oxygen_unit','nitrate_unit','nitrite_unit','nitro_unit','org_carb_unit','org_matter_unit','org_nitro_unit','part_org_carb_unit','part_org_nitro_unit','tot_carb_unit','tot_diss_nitro_unit','tot_inorg_nitro_unit','tot_nitro_content_unit','tot_nitro_unit','tot_org_carb_unit','tot_part_carb_unit','ammonium','ammonium_unit','carbonate','carbonate_unit','hydrogen_ion','nitrate_plus_nitrite','nitrate_plus_nitrite_unit','omega_arag','pco2','pco2_unit','phosphate','phosphate_unit','pressure','pressure_unit','silicate','silicate_unit','tot_alkalinity','tot_alkalinity_unit','transmittance','transmittance_unit','biosample_accession','organism']);

export const AssayScalarFieldEnumSchema = z.enum(['id','assay_name','pcr_primer_forward','pcr_primer_reverse','sterilise_method','pcr_0_1','thermocycler','amplificationReactionVolume','assay_validation','targetTaxonomicAssay','targetTaxonomicScope','target_gene','target_subfragment','ampliconSize','pcr_primer_vol_forward','pcr_primer_vol_reverse','pcr_primer_conc_forward','pcr_primer_conc_reverse','probeReporter','probeQuencher','probe_seq','probe_ref','probe_conc','commercial_mm','custom_mm','pcr_dna_vol','pcr_rep','nucl_acid_amp','pcr_cond','annealingTemp','pcr_cycles','pcr_analysis_software','pcr_method_additional','assay_type']);

export const PrimerScalarFieldEnumSchema = z.enum(['id','pcr_primer_forward','pcr_primer_reverse','pcr_primer_name_forward','pcr_primer_name_reverse','pcr_primer_reference_forward','pcr_primer_reference_reverse']);

export const LibraryScalarFieldEnumSchema = z.enum(['id','lib_id','userDefined','assay_name','samp_name','barcoding_pcr_appr','platform','instrument','seq_kit','lib_layout','sequencing_location','adapter_forward','adapter_reverse','lib_screen','seq_method_additional','mid_forward','mid_reverse','filename','filename2','seq_run_id','input_read_count','checksum_filename','checksum_filename2','lib_conc','lib_conc_meth','lib_conc_unit','phix_perc','checksum_method','pcr2_amplificationReactionVolume','pcr2_analysis_software','pcr2_annealingTemp','pcr2_commercial_mm','pcr2_cond','pcr2_custom_mm','pcr2_cycles','pcr2_dna_vol','pcr2_method_additional','pcr2_plate_id','pcr2_thermocycler','associatedSequences','pcr_plate_id','block_ref','block_seq','block_taxa','inhibition_check','inhibition_check_0_1']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullableJsonNullValueInputSchema = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const JsonNullValueFilterSchema = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.JsonNull : value === 'AnyNull' ? Prisma.AnyNull : value);

export const NullsOrderSchema = z.enum(['first','last']);

export const AnalysisOrderByRelevanceFieldEnumSchema = z.enum(['analysis_run_name','project_id','assay_name','sop_bioinformatics','trim_method','trim_param','demux_tool','merge_tool','min_len_tool','error_rate_tool','error_rate_type','chimera_check_method','chimera_check_param','otu_clust_tool','min_reads_cutoff_unit','min_reads_tool','otu_db','otu_db_custom','tax_assign_cat','otu_seq_comp_appr','tax_class_collapse','tax_class_other','screen_contam_method','screen_geograph_method','screen_nontarget_method','screen_other','bioinfo_method_additional','asv_method','dada2_pooling_method','dada2_chimera_method','otu_final_description','otu_raw_description','qiime2_version','tourmaline_asv_method','tourmaline_classify_method']);

export const OccurrenceOrderByRelevanceFieldEnumSchema = z.enum(['samp_name','analysis_run_name','featureid']);

export const AssignmentOrderByRelevanceFieldEnumSchema = z.enum(['analysis_run_name','featureid','taxonomy']);

export const FeatureOrderByRelevanceFieldEnumSchema = z.enum(['featureid','dna_sequence']);

export const TaxonomyOrderByRelevanceFieldEnumSchema = z.enum(['taxonomy','verbatimIdentification','domain','kingdom','supergroup','division','subdivision','phylum','class','order','family','genus','species']);

export const ProjectOrderByRelevanceFieldEnumSchema = z.enum(['project_id','userIds','recordedBy','recordedByID','project_contact','institution','institutionID','project_name','parent_project_id','study_factor','assay_type','expedition_id','ship_crs_expocode','woce_sect','bioproject_accession','license','rightsHolder','accessRights','informationWithheld','dataGeneralizations','bibliographicCitation','associated_resource','checkls_ver','seq_archive','code_repo']);

export const SampleOrderByRelevanceFieldEnumSchema = z.enum(['samp_name','project_id','samp_category','neg_cont_type','pos_cont_type','verbatimLatitude','verbatimLongitude','verbatimCoordinateSystem','verbatimSRS','geo_loc_name','eventDate','eventDurationUnit','verbatimEventDate','verbatimEventTime','verbatimDateEnd','verbatimTimeEnd','env_broad_scale','env_local_scale','env_medium','samp_collect_method','samp_collect_device','samp_size_unit','serial_number','line_id','station_id','ctd_cast_number','ctd_bottle_number','replicate_number','samp_collect_notes','samp_store_sol','samp_store_dur','samp_store_method_additional','dna_store_loc','samp_store_loc','samp_mat_process','filter_onsite_dur','size_frac_low','filter_material','filter_name','precip_chem_prep','prepped_samp_store_temp','prepped_samp_store_sol','prepped_samp_store_dur','prep_method_additional','prefilter_material','pump_flow_rate_unit','stationed_sample_dur','extract_id','extract_plate','extract_well_position','materialSampleID','sample_derived_from','sample_composed_of','rel_cont_id','biological_rep_relation','samp_vol_we_dna_ext_unit','nucl_acid_ext_lysis','nucl_acid_ext_sep','nucl_acid_ext','nucl_acid_ext_kit','nucl_acid_ext_modify','dna_cleanup_method','concentration_method','nucl_acid_ext_method_additional','concentration_unit','date_ext','dna_yield_unit','samp_weather','ph_meth','tidal_stage','solar_irradiance','wind_direction','diss_inorg_carb_unit','diss_inorg_nitro_unit','diss_org_carb_unit','diss_org_nitro_unit','diss_oxygen_unit','nitrate_unit','nitrite_unit','nitro_unit','org_carb_unit','org_matter_unit','org_nitro_unit','part_org_carb_unit','part_org_nitro_unit','tot_carb_unit','tot_diss_nitro_unit','tot_inorg_nitro_unit','tot_nitro_content_unit','tot_nitro_unit','tot_org_carb_unit','tot_part_carb_unit','ammonium','ammonium_unit','carbonate_unit','nitrate_plus_nitrite_unit','pco2_unit','phosphate_unit','pressure_unit','silicate_unit','tot_alkalinity_unit','transmittance_unit','biosample_accession','organism']);

export const AssayOrderByRelevanceFieldEnumSchema = z.enum(['assay_name','pcr_primer_forward','pcr_primer_reverse','sterilise_method','thermocycler','assay_validation','targetTaxonomicAssay','targetTaxonomicScope','target_gene','target_subfragment','probeReporter','probeQuencher','probe_seq','probe_ref','commercial_mm','custom_mm','nucl_acid_amp','pcr_cond','annealingTemp','pcr_analysis_software','pcr_method_additional','assay_type']);

export const PrimerOrderByRelevanceFieldEnumSchema = z.enum(['pcr_primer_forward','pcr_primer_reverse','pcr_primer_name_forward','pcr_primer_name_reverse','pcr_primer_reference_forward','pcr_primer_reference_reverse']);

export const LibraryOrderByRelevanceFieldEnumSchema = z.enum(['lib_id','assay_name','samp_name','barcoding_pcr_appr','platform','instrument','seq_kit','lib_layout','sequencing_location','adapter_forward','adapter_reverse','lib_screen','seq_method_additional','mid_forward','mid_reverse','filename','filename2','seq_run_id','checksum_filename','checksum_filename2','lib_conc_meth','lib_conc_unit','checksum_method','pcr2_analysis_software','pcr2_commercial_mm','pcr2_cond','pcr2_custom_mm','pcr2_method_additional','pcr2_plate_id','pcr2_thermocycler','associatedSequences','pcr_plate_id','block_ref','block_seq','block_taxa','inhibition_check']);

export const DeadBooleanSchema = z.enum(['false','true','not_applicableCOLON__control_sample','not_applicableCOLON__sample_group','not_applicable','missingCOLON__not_collectedCOLON__synthetic_construct','missingCOLON__not_collectedCOLON__lab_stock','missingCOLON__not_collectedCOLON__third_party_data','missingCOLON__not_collected','missingCOLON__not_providedCOLON__data_agreement_established_pre__2023','missingCOLON__not_provided','missingCOLON__restricted_accessCOLON__endangered_species','missingCOLON__restricted_accessCOLON__human__identifiable','missingCOLON__restricted_access']);

export type DeadBooleanType = `${z.infer<typeof DeadBooleanSchema>}`

export const detection_typeSchema = z.enum(['targeted_taxon_detection','multi_taxon_detection','other']);

export type detection_typeType = `${z.infer<typeof detection_typeSchema>}`

export const neg_cont_typeSchema = z.enum(['site_negative','field_negative','process_negative','extraction_negative','PCR_negative','other']);

export type neg_cont_typeType = `${z.infer<typeof neg_cont_typeSchema>}`

export const target_geneSchema = z.enum(['TWELVE__S_rRNA','SIXTEEN__S_rRNA','EIGHTEEN__S_rRNA','TWENTY_THREE__S_rRNA','TWENTY_EIGHT__S_rRNA','rbcL','CytB','COI','COII','COIII','nifH','ITS','ND1','ND2','ND3','ND4','ND5','ND6','amoA','rpoB','rpoC1','rpoC2','matK','trnH','trnL','psbK','D__loop','other']);

export type target_geneType = `${z.infer<typeof target_geneSchema>}`

export const probeQuencherSchema = z.enum(['Zero__End_Quencher_PAREN1_ZENPAREN2_','TAMRA','lowa_Black','Minor_Groove_Binder_PAREN1_MGBPAREN2_','Black_Hole_Quencher_PAREN1_BHQPAREN2_','other']);

export type probeQuencherType = `${z.infer<typeof probeQuencherSchema>}`

export const barcoding_pcr_apprSchema = z.enum(['one__step_PCR','two__step_PCR','ligation__based','other']);

export type barcoding_pcr_apprType = `${z.infer<typeof barcoding_pcr_apprSchema>}`

export const platformSchema = z.enum(['ILLUMINA','BGISEQ','CAPILLARY','DNBSEQ','ELEMENT','GENAPSYS','GENEMIND','HELICOS','ION_TORRENT','LS454','OXFORD_NANOPORE','PACBIO_SMRT','TAPESTRI','VELA_DIAGNOSTICS','ULTIMA','other']);

export type platformType = `${z.infer<typeof platformSchema>}`

export const lib_layoutSchema = z.enum(['paired_end','single_end','other']);

export type lib_layoutType = `${z.infer<typeof lib_layoutSchema>}`

export const error_rate_typeSchema = z.enum(['Phred_score','expected_error_rate','other']);

export type error_rate_typeType = `${z.infer<typeof error_rate_typeSchema>}`

export const min_reads_cutoff_unitSchema = z.enum(['reads','PERCENT_','other']);

export type min_reads_cutoff_unitType = `${z.infer<typeof min_reads_cutoff_unitSchema>}`

export const tax_assign_catSchema = z.enum(['sequence_similarity','sequence_composition','phylogeny','probabilistic','other']);

export type tax_assign_catType = `${z.infer<typeof tax_assign_catSchema>}`

export const samp_categorySchema = z.enum(['sample','negative_control','positive_control','PCR_standard','other']);

export type samp_categoryType = `${z.infer<typeof samp_categorySchema>}`

export const verbatimCoordinateSystemSchema = z.enum(['decimal_degrees','degrees_minutes_seconds','UTM','other']);

export type verbatimCoordinateSystemType = `${z.infer<typeof verbatimCoordinateSystemSchema>}`

export const verbatimSRSSchema = z.enum(['WGS84','NAD84','NAD27','GDA94','GDA2020','ETRS89','JGD2000','other']);

export type verbatimSRSType = `${z.infer<typeof verbatimSRSSchema>}`

export const eventDurationUnitSchema = z.enum(['minutes','hours','days','months','years']);

export type eventDurationUnitType = `${z.infer<typeof eventDurationUnitSchema>}`

export const samp_size_unitSchema = z.enum(['mL','L','mg','g','kg','cm2','m2','cm3','m3','other']);

export type samp_size_unitType = `${z.infer<typeof samp_size_unitSchema>}`

export const samp_store_solSchema = z.enum(['ethanol','sodium_acetate','longmire','lysis_buffer','none','other']);

export type samp_store_solType = `${z.infer<typeof samp_store_solSchema>}`

export const filter_materialSchema = z.enum(['cellulose','cellulose_ester','glass_fiber','thermoplastic_membrane','track_etched_polycarbonate','nylon','other']);

export type filter_materialType = `${z.infer<typeof filter_materialSchema>}`

export const precip_chem_prepSchema = z.enum(['ethanol','isopropanol','sodium_chloride','other']);

export type precip_chem_prepType = `${z.infer<typeof precip_chem_prepSchema>}`

export const prepped_samp_store_solSchema = z.enum(['ethanol','sodium_acetate','longmire','lysis_buffer','none','other']);

export type prepped_samp_store_solType = `${z.infer<typeof prepped_samp_store_solSchema>}`

export const samp_vol_we_dna_ext_unitSchema = z.enum(['mL','L','mg','g','kg','cm2','m2','cm3','m3','other']);

export type samp_vol_we_dna_ext_unitType = `${z.infer<typeof samp_vol_we_dna_ext_unitSchema>}`

export const nucl_acid_ext_lysisSchema = z.enum(['physical','chemical','enzymatic','thermal','osmotic','other']);

export type nucl_acid_ext_lysisType = `${z.infer<typeof nucl_acid_ext_lysisSchema>}`

export const nucl_acid_ext_sepSchema = z.enum(['column__based','magnetic_beads','centrifugation','precipitation','phenol_chloroform','g','electrophoresis','other']);

export type nucl_acid_ext_sepType = `${z.infer<typeof nucl_acid_ext_sepSchema>}`

export const asv_methodSchema = z.enum(['dada2pe','dada2se','deblur','other']);

export type asv_methodType = `${z.infer<typeof asv_methodSchema>}`

export const dada2_pooling_methodSchema = z.enum(['independent','pseudo','standard']);

export type dada2_pooling_methodType = `${z.infer<typeof dada2_pooling_methodSchema>}`

export const dada2_chimera_methodSchema = z.enum(['consensus','none','pooled']);

export type dada2_chimera_methodType = `${z.infer<typeof dada2_chimera_methodSchema>}`

export const lib_conc_unitSchema = z.enum(['ngFSLASH_µL','nM','pM','other']);

export type lib_conc_unitType = `${z.infer<typeof lib_conc_unitSchema>}`

export const checksum_methodSchema = z.enum(['MD5','SHA__256','CRC__32','other']);

export type checksum_methodType = `${z.infer<typeof checksum_methodSchema>}`

export const assay_typeSchema = z.enum(['targeted','metabarcoding','other']);

export type assay_typeType = `${z.infer<typeof assay_typeSchema>}`

export const diss_inorg_carb_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','µmolFSLASH_kg','mmolFSLASH_kg','parts_per_million','other']);

export type diss_inorg_carb_unitType = `${z.infer<typeof diss_inorg_carb_unitSchema>}`

export const diss_inorg_nitro_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','µmolFSLASH_kg','mmolFSLASH_kg','parts_per_million','other']);

export type diss_inorg_nitro_unitType = `${z.infer<typeof diss_inorg_nitro_unitSchema>}`

export const diss_org_carb_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','µmolFSLASH_kg','mmolFSLASH_kg','parts_per_million','other']);

export type diss_org_carb_unitType = `${z.infer<typeof diss_org_carb_unitSchema>}`

export const diss_org_nitro_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','µmolFSLASH_kg','mmolFSLASH_kg','parts_per_million','other']);

export type diss_org_nitro_unitType = `${z.infer<typeof diss_org_nitro_unitSchema>}`

export const diss_oxygen_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','mLFSLASH_L','mmolFSLASH_kg','parts_per_million','other']);

export type diss_oxygen_unitType = `${z.infer<typeof diss_oxygen_unitSchema>}`

export const nitrate_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','µmolFSLASH_kg','mmolFSLASH_kg','parts_per_million','other']);

export type nitrate_unitType = `${z.infer<typeof nitrate_unitSchema>}`

export const nitrite_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','µmolFSLASH_kg','mmolFSLASH_kg','parts_per_million','other']);

export type nitrite_unitType = `${z.infer<typeof nitrite_unitSchema>}`

export const nitro_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','µmolFSLASH_kg','mmolFSLASH_kg','parts_per_million','other']);

export type nitro_unitType = `${z.infer<typeof nitro_unitSchema>}`

export const org_carb_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','µmolFSLASH_kg','mmolFSLASH_kg','parts_per_million','other']);

export type org_carb_unitType = `${z.infer<typeof org_carb_unitSchema>}`

export const org_matter_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','µmolFSLASH_kg','mmolFSLASH_kg','parts_per_million','other']);

export type org_matter_unitType = `${z.infer<typeof org_matter_unitSchema>}`

export const org_nitro_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','µmolFSLASH_kg','mmolFSLASH_kg','parts_per_million','other']);

export type org_nitro_unitType = `${z.infer<typeof org_nitro_unitSchema>}`

export const part_org_carb_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','µmolFSLASH_kg','mmolFSLASH_kg','parts_per_million','other']);

export type part_org_carb_unitType = `${z.infer<typeof part_org_carb_unitSchema>}`

export const part_org_nitro_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','µmolFSLASH_kg','mmolFSLASH_kg','parts_per_million','other']);

export type part_org_nitro_unitType = `${z.infer<typeof part_org_nitro_unitSchema>}`

export const tot_carb_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','µmolFSLASH_kg','mmolFSLASH_kg','parts_per_million','other']);

export type tot_carb_unitType = `${z.infer<typeof tot_carb_unitSchema>}`

export const tot_diss_nitro_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','µmolFSLASH_kg','mmolFSLASH_kg','parts_per_million','other']);

export type tot_diss_nitro_unitType = `${z.infer<typeof tot_diss_nitro_unitSchema>}`

export const tot_inorg_nitro_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','µmolFSLASH_kg','mmolFSLASH_kg','parts_per_million','other']);

export type tot_inorg_nitro_unitType = `${z.infer<typeof tot_inorg_nitro_unitSchema>}`

export const tot_nitro_content_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','µmolFSLASH_kg','mmolFSLASH_kg','parts_per_million','other']);

export type tot_nitro_content_unitType = `${z.infer<typeof tot_nitro_content_unitSchema>}`

export const tot_nitro_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','µmolFSLASH_kg','mmolFSLASH_kg','parts_per_million','other']);

export type tot_nitro_unitType = `${z.infer<typeof tot_nitro_unitSchema>}`

export const tot_org_carb_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','µmolFSLASH_kg','mmolFSLASH_kg','parts_per_million','other']);

export type tot_org_carb_unitType = `${z.infer<typeof tot_org_carb_unitSchema>}`

export const tot_part_carb_unitSchema = z.enum(['µM','molFSLASH_m3','mmolFSLASH_m3','µmolFSLASH_m3','molFSLASH_L','mmolFSLASH_L','µmolFSLASH_L','mgFSLASH_L','µgFSLASH_L','µmolFSLASH_kg','mmolFSLASH_kg','parts_per_million','other']);

export type tot_part_carb_unitType = `${z.infer<typeof tot_part_carb_unitSchema>}`

export const concentration_unitSchema = z.enum(['ngFSLASH_µl','copiesFSLASH_µl','other']);

export type concentration_unitType = `${z.infer<typeof concentration_unitSchema>}`

export const pump_flow_rate_unitSchema = z.enum(['m3FSLASH_s','m3FSLASH_min','m3FSLASH_h','LFSLASH_s','LFSLASH_min','LFSLASH_h','other']);

export type pump_flow_rate_unitType = `${z.infer<typeof pump_flow_rate_unitSchema>}`

export const ammonium_unitSchema = z.enum(['micromole_per_liter','milligram_per_liter','parts_per_million']);

export type ammonium_unitType = `${z.infer<typeof ammonium_unitSchema>}`

export const phosphate_unitSchema = z.enum(['micromole_per_liter']);

export type phosphate_unitType = `${z.infer<typeof phosphate_unitSchema>}`

export const pressure_unitSchema = z.enum(['atmosphere']);

export type pressure_unitType = `${z.infer<typeof pressure_unitSchema>}`

export const silicate_unitSchema = z.enum(['micromole_per_liter']);

export type silicate_unitType = `${z.infer<typeof silicate_unitSchema>}`

export const tourmaline_classify_methodSchema = z.enum(['consensus__blast','naive__bayes','consensus__vsearch','bt2__blca']);

export type tourmaline_classify_methodType = `${z.infer<typeof tourmaline_classify_methodSchema>}`

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
  /**
   * [EditHistoryType]
   */
  editHistory: JsonValueSchema.nullable(),
  project_id: z.string(),
  assay_name: z.string(),
  sop_bioinformatics: z.string().nullish(),
  trim_method: z.string().nullish(),
  trim_param: z.string().nullish(),
  demux_tool: z.string().nullish(),
  demux_max_mismatch: z.coerce.number().int().nullish(),
  merge_tool: z.string().nullish(),
  merge_min_overlap: z.coerce.number().int().nullish(),
  min_len_cutoff: z.coerce.number().int().nullish(),
  min_len_tool: z.string().nullish(),
  error_rate_tool: z.string().nullish(),
  error_rate_type: z.string().nullish(),
  error_rate_cutoff: z.coerce.number().nullish(),
  chimera_check_method: z.string().nullish(),
  chimera_check_param: z.string().nullish(),
  otu_clust_tool: z.string().nullish(),
  otu_clust_cutoff: z.coerce.number().nullish(),
  min_reads_cutoff: z.coerce.number().nullish(),
  min_reads_cutoff_unit: z.string().nullish(),
  min_reads_tool: z.string().nullish(),
  otu_db: z.string().nullish(),
  otu_db_custom: z.string().nullish(),
  tax_assign_cat: z.string().nullish(),
  otu_seq_comp_appr: z.string().nullish(),
  tax_class_id_cutoff: z.coerce.number().nullish(),
  tax_class_query_cutoff: z.coerce.number().nullish(),
  tax_class_collapse: z.string().nullish(),
  tax_class_other: z.string().nullish(),
  screen_contam_method: z.string().nullish(),
  screen_geograph_method: z.string().nullish(),
  screen_nontarget_method: z.string().nullish(),
  screen_other: z.string().nullish(),
  bioinfo_method_additional: z.string().nullish(),
  asv_method: z.string().nullish(),
  dada2_trunc_len_f: z.coerce.number().int().nullish(),
  dada2pe_trunc_len_r: z.coerce.number().int().nullish(),
  dada2_trim_left_f: z.coerce.number().int().nullish(),
  dada2pe_trim_left_r: z.coerce.number().int().nullish(),
  dada2_max_ee_f: z.coerce.number().int().nullish(),
  dada2pe_max_ee_r: z.coerce.number().int().nullish(),
  dada2_trunc_q: z.coerce.number().int().nullish(),
  dada2_pooling_method: z.string().nullish(),
  dada2_chimera_method: z.string().nullish(),
  dada2_min_fold_parent_over_abundance: z.coerce.number().int().nullish(),
  dada2_n_reads_learn: z.coerce.number().int().nullish(),
  deblur_trim_length: z.coerce.number().int().nullish(),
  deblur_mean_error: z.coerce.number().nullish(),
  deblur_indel_prob: z.coerce.number().nullish(),
  deblur_indel_max: z.coerce.number().int().nullish(),
  deblur_min_reads: z.coerce.number().int().nullish(),
  deblur_min_size: z.coerce.number().int().nullish(),
  repseqs_min_length: z.coerce.number().int().nullish(),
  repseqs_max_length: z.coerce.number().int().nullish(),
  repseqs_min_abundance: z.coerce.number().nullish(),
  repseqs_min_prevalence: z.coerce.number().nullish(),
  otu_num_tax_assigned: z.coerce.number().int().nullish(),
  output_otu_num: z.coerce.number().int().nullish(),
  output_read_count: z.coerce.number().int().nullish(),
  otu_final_description: z.string().nullish(),
  otu_raw_description: z.string().nullish(),
  qiime2_version: z.string().nullish(),
  tourmaline_asv_method: z.string().nullish(),
  skl_confidence: z.coerce.number().nullish(),
  min_consensus: z.coerce.number().nullish(),
  tourmaline_classify_method: z.string().nullish(),
  blca_confidence: z.coerce.number().nullish(),
  percent_match: z.number().array().max(2),
  percent_query_cover: z.number().array().max(2),
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
  percent_match: z.number().array().max(2).optional(),
  percent_query_cover: z.number().array().max(2).optional(),
}))

export type AnalysisOptionalDefaults = z.infer<typeof AnalysisOptionalDefaultsSchema>

// ANALYSIS RELATION SCHEMA
//------------------------------------------------------

export type AnalysisRelations = {
  Project: ProjectWithRelations;
  Assay: AssayWithRelations;
  Occurrences: OccurrenceWithRelations[];
  Assignments: AssignmentWithRelations[];
};

export type AnalysisWithRelations = Omit<z.infer<typeof AnalysisSchema>, "editHistory"> & {
  editHistory?: JsonValueType | null;
} & AnalysisRelations

export const AnalysisWithRelationsSchema: z.ZodType<AnalysisWithRelations> = AnalysisSchema.merge(z.object({
  Project: z.lazy(() => ProjectWithRelationsSchema),
  Assay: z.lazy(() => AssayWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrenceWithRelationsSchema).array(),
  Assignments: z.lazy(() => AssignmentWithRelationsSchema).array(),
}))

// ANALYSIS OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type AnalysisOptionalDefaultsRelations = {
  Project: ProjectOptionalDefaultsWithRelations;
  Assay: AssayOptionalDefaultsWithRelations;
  Occurrences: OccurrenceOptionalDefaultsWithRelations[];
  Assignments: AssignmentOptionalDefaultsWithRelations[];
};

export type AnalysisOptionalDefaultsWithRelations = Omit<z.infer<typeof AnalysisOptionalDefaultsSchema>, "editHistory"> & {
  editHistory?: JsonValueType | null;
} & AnalysisOptionalDefaultsRelations

export const AnalysisOptionalDefaultsWithRelationsSchema: z.ZodType<AnalysisOptionalDefaultsWithRelations> = AnalysisOptionalDefaultsSchema.merge(z.object({
  Project: z.lazy(() => ProjectOptionalDefaultsWithRelationsSchema),
  Assay: z.lazy(() => AssayOptionalDefaultsWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrenceOptionalDefaultsWithRelationsSchema).array(),
  Assignments: z.lazy(() => AssignmentOptionalDefaultsWithRelationsSchema).array(),
}))

// ANALYSIS PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type AnalysisPartialRelations = {
  Project?: ProjectPartialWithRelations;
  Assay?: AssayPartialWithRelations;
  Occurrences?: OccurrencePartialWithRelations[];
  Assignments?: AssignmentPartialWithRelations[];
};

export type AnalysisPartialWithRelations = Omit<z.infer<typeof AnalysisPartialSchema>, "editHistory"> & {
  editHistory?: JsonValueType | null;
} & AnalysisPartialRelations

export const AnalysisPartialWithRelationsSchema: z.ZodType<AnalysisPartialWithRelations> = AnalysisPartialSchema.merge(z.object({
  Project: z.lazy(() => ProjectPartialWithRelationsSchema),
  Assay: z.lazy(() => AssayPartialWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrencePartialWithRelationsSchema).array(),
  Assignments: z.lazy(() => AssignmentPartialWithRelationsSchema).array(),
})).partial()

export type AnalysisOptionalDefaultsWithPartialRelations = Omit<z.infer<typeof AnalysisOptionalDefaultsSchema>, "editHistory"> & {
  editHistory?: JsonValueType | null;
} & AnalysisPartialRelations

export const AnalysisOptionalDefaultsWithPartialRelationsSchema: z.ZodType<AnalysisOptionalDefaultsWithPartialRelations> = AnalysisOptionalDefaultsSchema.merge(z.object({
  Project: z.lazy(() => ProjectPartialWithRelationsSchema),
  Assay: z.lazy(() => AssayPartialWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrencePartialWithRelationsSchema).array(),
  Assignments: z.lazy(() => AssignmentPartialWithRelationsSchema).array(),
}).partial())

export type AnalysisWithPartialRelations = Omit<z.infer<typeof AnalysisSchema>, "editHistory"> & {
  editHistory?: JsonValueType | null;
} & AnalysisPartialRelations

export const AnalysisWithPartialRelationsSchema: z.ZodType<AnalysisWithPartialRelations> = AnalysisSchema.merge(z.object({
  Project: z.lazy(() => ProjectPartialWithRelationsSchema),
  Assay: z.lazy(() => AssayPartialWithRelationsSchema),
  Occurrences: z.lazy(() => OccurrencePartialWithRelationsSchema).array(),
  Assignments: z.lazy(() => AssignmentPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// OCCURRENCE SCHEMA
/////////////////////////////////////////

export const OccurrenceSchema = z.object({
  id: z.number().int(),
  samp_name: z.string(),
  analysis_run_name: z.string(),
  featureid: z.string(),
  organismQuantity: z.coerce.number().int(),
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
  Sample: SampleWithRelations;
  Analysis: AnalysisWithRelations;
  Feature: FeatureWithRelations;
};

export type OccurrenceWithRelations = z.infer<typeof OccurrenceSchema> & OccurrenceRelations

export const OccurrenceWithRelationsSchema: z.ZodType<OccurrenceWithRelations> = OccurrenceSchema.merge(z.object({
  Sample: z.lazy(() => SampleWithRelationsSchema),
  Analysis: z.lazy(() => AnalysisWithRelationsSchema),
  Feature: z.lazy(() => FeatureWithRelationsSchema),
}))

// OCCURRENCE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type OccurrenceOptionalDefaultsRelations = {
  Sample: SampleOptionalDefaultsWithRelations;
  Analysis: AnalysisOptionalDefaultsWithRelations;
  Feature: FeatureOptionalDefaultsWithRelations;
};

export type OccurrenceOptionalDefaultsWithRelations = z.infer<typeof OccurrenceOptionalDefaultsSchema> & OccurrenceOptionalDefaultsRelations

export const OccurrenceOptionalDefaultsWithRelationsSchema: z.ZodType<OccurrenceOptionalDefaultsWithRelations> = OccurrenceOptionalDefaultsSchema.merge(z.object({
  Sample: z.lazy(() => SampleOptionalDefaultsWithRelationsSchema),
  Analysis: z.lazy(() => AnalysisOptionalDefaultsWithRelationsSchema),
  Feature: z.lazy(() => FeatureOptionalDefaultsWithRelationsSchema),
}))

// OCCURRENCE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type OccurrencePartialRelations = {
  Sample?: SamplePartialWithRelations;
  Analysis?: AnalysisPartialWithRelations;
  Feature?: FeaturePartialWithRelations;
};

export type OccurrencePartialWithRelations = z.infer<typeof OccurrencePartialSchema> & OccurrencePartialRelations

export const OccurrencePartialWithRelationsSchema: z.ZodType<OccurrencePartialWithRelations> = OccurrencePartialSchema.merge(z.object({
  Sample: z.lazy(() => SamplePartialWithRelationsSchema),
  Analysis: z.lazy(() => AnalysisPartialWithRelationsSchema),
  Feature: z.lazy(() => FeaturePartialWithRelationsSchema),
})).partial()

export type OccurrenceOptionalDefaultsWithPartialRelations = z.infer<typeof OccurrenceOptionalDefaultsSchema> & OccurrencePartialRelations

export const OccurrenceOptionalDefaultsWithPartialRelationsSchema: z.ZodType<OccurrenceOptionalDefaultsWithPartialRelations> = OccurrenceOptionalDefaultsSchema.merge(z.object({
  Sample: z.lazy(() => SamplePartialWithRelationsSchema),
  Analysis: z.lazy(() => AnalysisPartialWithRelationsSchema),
  Feature: z.lazy(() => FeaturePartialWithRelationsSchema),
}).partial())

export type OccurrenceWithPartialRelations = z.infer<typeof OccurrenceSchema> & OccurrencePartialRelations

export const OccurrenceWithPartialRelationsSchema: z.ZodType<OccurrenceWithPartialRelations> = OccurrenceSchema.merge(z.object({
  Sample: z.lazy(() => SamplePartialWithRelationsSchema),
  Analysis: z.lazy(() => AnalysisPartialWithRelationsSchema),
  Feature: z.lazy(() => FeaturePartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// ASSIGNMENT SCHEMA
/////////////////////////////////////////

export const AssignmentSchema = z.object({
  id: z.number().int(),
  analysis_run_name: z.string(),
  featureid: z.string(),
  taxonomy: z.string(),
  Confidence: z.coerce.number(),
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
};

export type AssignmentWithRelations = z.infer<typeof AssignmentSchema> & AssignmentRelations

export const AssignmentWithRelationsSchema: z.ZodType<AssignmentWithRelations> = AssignmentSchema.merge(z.object({
  Analysis: z.lazy(() => AnalysisWithRelationsSchema),
  Feature: z.lazy(() => FeatureWithRelationsSchema),
  Taxonomy: z.lazy(() => TaxonomyWithRelationsSchema),
}))

// ASSIGNMENT OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type AssignmentOptionalDefaultsRelations = {
  Analysis: AnalysisOptionalDefaultsWithRelations;
  Feature: FeatureOptionalDefaultsWithRelations;
  Taxonomy: TaxonomyOptionalDefaultsWithRelations;
};

export type AssignmentOptionalDefaultsWithRelations = z.infer<typeof AssignmentOptionalDefaultsSchema> & AssignmentOptionalDefaultsRelations

export const AssignmentOptionalDefaultsWithRelationsSchema: z.ZodType<AssignmentOptionalDefaultsWithRelations> = AssignmentOptionalDefaultsSchema.merge(z.object({
  Analysis: z.lazy(() => AnalysisOptionalDefaultsWithRelationsSchema),
  Feature: z.lazy(() => FeatureOptionalDefaultsWithRelationsSchema),
  Taxonomy: z.lazy(() => TaxonomyOptionalDefaultsWithRelationsSchema),
}))

// ASSIGNMENT PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type AssignmentPartialRelations = {
  Analysis?: AnalysisPartialWithRelations;
  Feature?: FeaturePartialWithRelations;
  Taxonomy?: TaxonomyPartialWithRelations;
};

export type AssignmentPartialWithRelations = z.infer<typeof AssignmentPartialSchema> & AssignmentPartialRelations

export const AssignmentPartialWithRelationsSchema: z.ZodType<AssignmentPartialWithRelations> = AssignmentPartialSchema.merge(z.object({
  Analysis: z.lazy(() => AnalysisPartialWithRelationsSchema),
  Feature: z.lazy(() => FeaturePartialWithRelationsSchema),
  Taxonomy: z.lazy(() => TaxonomyPartialWithRelationsSchema),
})).partial()

export type AssignmentOptionalDefaultsWithPartialRelations = z.infer<typeof AssignmentOptionalDefaultsSchema> & AssignmentPartialRelations

export const AssignmentOptionalDefaultsWithPartialRelationsSchema: z.ZodType<AssignmentOptionalDefaultsWithPartialRelations> = AssignmentOptionalDefaultsSchema.merge(z.object({
  Analysis: z.lazy(() => AnalysisPartialWithRelationsSchema),
  Feature: z.lazy(() => FeaturePartialWithRelationsSchema),
  Taxonomy: z.lazy(() => TaxonomyPartialWithRelationsSchema),
}).partial())

export type AssignmentWithPartialRelations = z.infer<typeof AssignmentSchema> & AssignmentPartialRelations

export const AssignmentWithPartialRelationsSchema: z.ZodType<AssignmentWithPartialRelations> = AssignmentSchema.merge(z.object({
  Analysis: z.lazy(() => AnalysisPartialWithRelationsSchema),
  Feature: z.lazy(() => FeaturePartialWithRelationsSchema),
  Taxonomy: z.lazy(() => TaxonomyPartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// FEATURE SCHEMA
/////////////////////////////////////////

export const FeatureSchema = z.object({
  id: z.number().int(),
  featureid: z.string(),
  dna_sequence: z.string(),
  sequenceLength: z.number().int(),
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
  domain: z.string().nullish(),
  kingdom: z.string().nullish(),
  supergroup: z.string().nullish(),
  division: z.string().nullish(),
  subdivision: z.string().nullish(),
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
  recordedBy: z.string(),
  recordedByID: z.string().nullish(),
  project_contact: z.string(),
  institution: z.string().nullish(),
  institutionID: z.string().nullish(),
  project_name: z.string(),
  parent_project_id: z.string().nullish(),
  study_factor: z.string().nullish(),
  assay_type: z.string(),
  expedition_id: z.string().nullish(),
  ship_crs_expocode: z.string().nullish(),
  woce_sect: z.string().nullish(),
  bioproject_accession: z.string().nullish(),
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
  biological_rep: z.coerce.number().int().nullish(),
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
  Analyses: AnalysisWithRelations[];
};

export type ProjectWithRelations = Omit<z.infer<typeof ProjectSchema>, "userDefined" | "editHistory"> & {
  userDefined?: JsonValueType | null;
  editHistory?: JsonValueType | null;
} & ProjectRelations

export const ProjectWithRelationsSchema: z.ZodType<ProjectWithRelations> = ProjectSchema.merge(z.object({
  Samples: z.lazy(() => SampleWithRelationsSchema).array(),
  Analyses: z.lazy(() => AnalysisWithRelationsSchema).array(),
}))

// PROJECT OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type ProjectOptionalDefaultsRelations = {
  Samples: SampleOptionalDefaultsWithRelations[];
  Analyses: AnalysisOptionalDefaultsWithRelations[];
};

export type ProjectOptionalDefaultsWithRelations = Omit<z.infer<typeof ProjectOptionalDefaultsSchema>, "userDefined" | "editHistory"> & {
  userDefined?: JsonValueType | null;
  editHistory?: JsonValueType | null;
} & ProjectOptionalDefaultsRelations

export const ProjectOptionalDefaultsWithRelationsSchema: z.ZodType<ProjectOptionalDefaultsWithRelations> = ProjectOptionalDefaultsSchema.merge(z.object({
  Samples: z.lazy(() => SampleOptionalDefaultsWithRelationsSchema).array(),
  Analyses: z.lazy(() => AnalysisOptionalDefaultsWithRelationsSchema).array(),
}))

// PROJECT PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type ProjectPartialRelations = {
  Samples?: SamplePartialWithRelations[];
  Analyses?: AnalysisPartialWithRelations[];
};

export type ProjectPartialWithRelations = Omit<z.infer<typeof ProjectPartialSchema>, "userDefined" | "editHistory"> & {
  userDefined?: JsonValueType | null;
  editHistory?: JsonValueType | null;
} & ProjectPartialRelations

export const ProjectPartialWithRelationsSchema: z.ZodType<ProjectPartialWithRelations> = ProjectPartialSchema.merge(z.object({
  Samples: z.lazy(() => SamplePartialWithRelationsSchema).array(),
  Analyses: z.lazy(() => AnalysisPartialWithRelationsSchema).array(),
})).partial()

export type ProjectOptionalDefaultsWithPartialRelations = Omit<z.infer<typeof ProjectOptionalDefaultsSchema>, "userDefined" | "editHistory"> & {
  userDefined?: JsonValueType | null;
  editHistory?: JsonValueType | null;
} & ProjectPartialRelations

export const ProjectOptionalDefaultsWithPartialRelationsSchema: z.ZodType<ProjectOptionalDefaultsWithPartialRelations> = ProjectOptionalDefaultsSchema.merge(z.object({
  Samples: z.lazy(() => SamplePartialWithRelationsSchema).array(),
  Analyses: z.lazy(() => AnalysisPartialWithRelationsSchema).array(),
}).partial())

export type ProjectWithPartialRelations = Omit<z.infer<typeof ProjectSchema>, "userDefined" | "editHistory"> & {
  userDefined?: JsonValueType | null;
  editHistory?: JsonValueType | null;
} & ProjectPartialRelations

export const ProjectWithPartialRelationsSchema: z.ZodType<ProjectWithPartialRelations> = ProjectSchema.merge(z.object({
  Samples: z.lazy(() => SamplePartialWithRelationsSchema).array(),
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
  /**
   * [UserDefinedType]
   */
  userDefined: JsonValueSchema.nullable(),
  project_id: z.string(),
  samp_category: z.string(),
  neg_cont_type: z.string().nullish(),
  pos_cont_type: z.string().nullish(),
  decimalLatitude: z.coerce.number().nullish(),
  decimalLongitude: z.coerce.number().nullish(),
  verbatimLatitude: z.string().nullish(),
  verbatimLongitude: z.string().nullish(),
  verbatimCoordinateSystem: z.string().nullish(),
  verbatimSRS: z.string().nullish(),
  geo_loc_name: z.string(),
  eventDate: z.string(),
  eventDurationValue: z.coerce.number().nullish(),
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
  samp_size: z.coerce.number().nullish(),
  samp_size_unit: z.string().nullish(),
  serial_number: z.string().nullish(),
  line_id: z.string().nullish(),
  station_id: z.string().nullish(),
  ctd_cast_number: z.string().nullish(),
  ctd_bottle_number: z.string().nullish(),
  replicate_number: z.string().nullish(),
  samp_collect_notes: z.string().nullish(),
  samp_store_temp: z.coerce.number().nullish(),
  samp_store_sol: z.string().nullish(),
  samp_store_dur: z.string().nullish(),
  samp_store_method_additional: z.string().nullish(),
  dna_store_loc: z.string().nullish(),
  samp_store_loc: z.string().nullish(),
  samp_mat_process: z.string().nullish(),
  filter_onsite_dur: z.string().nullish(),
  size_frac_low: z.string().nullish(),
  size_frac: z.coerce.number().nullish(),
  filter_diameter: z.coerce.number().nullish(),
  filter_surface_area: z.coerce.number().nullish(),
  filter_material: z.string().nullish(),
  filter_name: z.string().nullish(),
  precip_chem_prep: z.string().nullish(),
  precip_force_prep: z.coerce.number().nullish(),
  precip_time_prep: z.coerce.number().nullish(),
  precip_temp_prep: z.coerce.number().nullish(),
  prepped_samp_store_temp: z.string().nullish(),
  prepped_samp_store_sol: z.string().nullish(),
  prepped_samp_store_dur: z.string().nullish(),
  prep_method_additional: z.string().nullish(),
  prefilter_material: z.string().nullish(),
  pump_flow_rate: z.coerce.number().nullish(),
  pump_flow_rate_unit: z.string().nullish(),
  stationed_sample_dur: z.string().nullish(),
  extract_id: z.string().nullish(),
  extract_plate: z.string().nullish(),
  extract_well_number: z.coerce.number().int().nullish(),
  extract_well_position: z.string().nullish(),
  materialSampleID: z.string().nullish(),
  sample_derived_from: z.string().nullish(),
  sample_composed_of: z.string().nullish(),
  rel_cont_id: z.string().nullish(),
  biological_rep_relation: z.string().nullish(),
  samp_vol_we_dna_ext: z.coerce.number().nullish(),
  samp_vol_we_dna_ext_unit: z.string().nullish(),
  nucl_acid_ext_lysis: z.string().nullish(),
  nucl_acid_ext_sep: z.string().nullish(),
  nucl_acid_ext: z.string().nullish(),
  nucl_acid_ext_kit: z.string().nullish(),
  nucl_acid_ext_modify: z.string().nullish(),
  dna_cleanup_method: z.string().nullish(),
  concentration: z.coerce.number().nullish(),
  concentration_method: z.string().nullish(),
  ratioOfAbsorbance260_280: z.coerce.number().nullish(),
  pool_dna_num: z.coerce.number().int().nullish(),
  nucl_acid_ext_method_additional: z.string().nullish(),
  concentration_unit: z.string().nullish(),
  date_ext: z.string().nullish(),
  dna_yield: z.coerce.number().nullish(),
  dna_yield_unit: z.string().nullish(),
  samp_weather: z.string().nullish(),
  minimumDepthInMeters: z.coerce.number().nullish(),
  maximumDepthInMeters: z.coerce.number().nullish(),
  tot_depth_water_col: z.coerce.number().nullish(),
  elev: z.coerce.number().nullish(),
  temp: z.coerce.number().nullish(),
  chlorophyll: z.coerce.number().nullish(),
  light_intensity: z.coerce.number().nullish(),
  misc_param: z.coerce.number().nullish(),
  ph: z.coerce.number().nullish(),
  ph_meth: z.string().nullish(),
  salinity: z.coerce.number().nullish(),
  suspend_part_matter: z.coerce.number().nullish(),
  tidal_stage: z.string().nullish(),
  turbidity: z.coerce.number().nullish(),
  water_current: z.coerce.number().nullish(),
  solar_irradiance: z.string().nullish(),
  wind_direction: z.string().nullish(),
  wind_speed: z.coerce.number().nullish(),
  diss_inorg_carb: z.coerce.number().nullish(),
  diss_inorg_nitro: z.coerce.number().nullish(),
  diss_org_carb: z.coerce.number().nullish(),
  diss_org_nitro: z.coerce.number().nullish(),
  diss_oxygen: z.coerce.number().nullish(),
  tot_diss_nitro: z.coerce.number().nullish(),
  tot_inorg_nitro: z.coerce.number().nullish(),
  tot_nitro: z.coerce.number().nullish(),
  tot_part_carb: z.coerce.number().nullish(),
  tot_org_carb: z.coerce.number().nullish(),
  tot_org_c_meth: z.coerce.number().nullish(),
  tot_nitro_content: z.coerce.number().nullish(),
  tot_nitro_cont_meth: z.coerce.number().nullish(),
  tot_carb: z.coerce.number().nullish(),
  part_org_carb: z.coerce.number().nullish(),
  part_org_nitro: z.coerce.number().nullish(),
  nitrate: z.coerce.number().nullish(),
  nitrite: z.coerce.number().nullish(),
  nitro: z.coerce.number().nullish(),
  org_carb: z.coerce.number().nullish(),
  org_matter: z.coerce.number().nullish(),
  org_nitro: z.coerce.number().nullish(),
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
  carbonate: z.coerce.number().nullish(),
  carbonate_unit: z.string().nullish(),
  hydrogen_ion: z.coerce.number().nullish(),
  nitrate_plus_nitrite: z.coerce.number().nullish(),
  nitrate_plus_nitrite_unit: z.string().nullish(),
  omega_arag: z.coerce.number().nullish(),
  pco2: z.coerce.number().int().nullish(),
  pco2_unit: z.string().nullish(),
  phosphate: z.coerce.number().nullish(),
  phosphate_unit: z.string().nullish(),
  pressure: z.coerce.number().int().nullish(),
  pressure_unit: z.string().nullish(),
  silicate: z.coerce.number().nullish(),
  silicate_unit: z.string().nullish(),
  tot_alkalinity: z.coerce.number().nullish(),
  tot_alkalinity_unit: z.string().nullish(),
  transmittance: z.coerce.number().nullish(),
  transmittance_unit: z.string().nullish(),
  biosample_accession: z.string().nullish(),
  organism: z.string().nullish(),
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
  Assays: AssayWithRelations[];
  Libraries: LibraryWithRelations[];
  Occurrences: OccurrenceWithRelations[];
};

export type SampleWithRelations = Omit<z.infer<typeof SampleSchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & SampleRelations

export const SampleWithRelationsSchema: z.ZodType<SampleWithRelations> = SampleSchema.merge(z.object({
  Project: z.lazy(() => ProjectWithRelationsSchema),
  Assays: z.lazy(() => AssayWithRelationsSchema).array(),
  Libraries: z.lazy(() => LibraryWithRelationsSchema).array(),
  Occurrences: z.lazy(() => OccurrenceWithRelationsSchema).array(),
}))

// SAMPLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type SampleOptionalDefaultsRelations = {
  Project: ProjectOptionalDefaultsWithRelations;
  Assays: AssayOptionalDefaultsWithRelations[];
  Libraries: LibraryOptionalDefaultsWithRelations[];
  Occurrences: OccurrenceOptionalDefaultsWithRelations[];
};

export type SampleOptionalDefaultsWithRelations = Omit<z.infer<typeof SampleOptionalDefaultsSchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & SampleOptionalDefaultsRelations

export const SampleOptionalDefaultsWithRelationsSchema: z.ZodType<SampleOptionalDefaultsWithRelations> = SampleOptionalDefaultsSchema.merge(z.object({
  Project: z.lazy(() => ProjectOptionalDefaultsWithRelationsSchema),
  Assays: z.lazy(() => AssayOptionalDefaultsWithRelationsSchema).array(),
  Libraries: z.lazy(() => LibraryOptionalDefaultsWithRelationsSchema).array(),
  Occurrences: z.lazy(() => OccurrenceOptionalDefaultsWithRelationsSchema).array(),
}))

// SAMPLE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type SamplePartialRelations = {
  Project?: ProjectPartialWithRelations;
  Assays?: AssayPartialWithRelations[];
  Libraries?: LibraryPartialWithRelations[];
  Occurrences?: OccurrencePartialWithRelations[];
};

export type SamplePartialWithRelations = Omit<z.infer<typeof SamplePartialSchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & SamplePartialRelations

export const SamplePartialWithRelationsSchema: z.ZodType<SamplePartialWithRelations> = SamplePartialSchema.merge(z.object({
  Project: z.lazy(() => ProjectPartialWithRelationsSchema),
  Assays: z.lazy(() => AssayPartialWithRelationsSchema).array(),
  Libraries: z.lazy(() => LibraryPartialWithRelationsSchema).array(),
  Occurrences: z.lazy(() => OccurrencePartialWithRelationsSchema).array(),
})).partial()

export type SampleOptionalDefaultsWithPartialRelations = Omit<z.infer<typeof SampleOptionalDefaultsSchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & SamplePartialRelations

export const SampleOptionalDefaultsWithPartialRelationsSchema: z.ZodType<SampleOptionalDefaultsWithPartialRelations> = SampleOptionalDefaultsSchema.merge(z.object({
  Project: z.lazy(() => ProjectPartialWithRelationsSchema),
  Assays: z.lazy(() => AssayPartialWithRelationsSchema).array(),
  Libraries: z.lazy(() => LibraryPartialWithRelationsSchema).array(),
  Occurrences: z.lazy(() => OccurrencePartialWithRelationsSchema).array(),
}).partial())

export type SampleWithPartialRelations = Omit<z.infer<typeof SampleSchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & SamplePartialRelations

export const SampleWithPartialRelationsSchema: z.ZodType<SampleWithPartialRelations> = SampleSchema.merge(z.object({
  Project: z.lazy(() => ProjectPartialWithRelationsSchema),
  Assays: z.lazy(() => AssayPartialWithRelationsSchema).array(),
  Libraries: z.lazy(() => LibraryPartialWithRelationsSchema).array(),
  Occurrences: z.lazy(() => OccurrencePartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// ASSAY SCHEMA
/////////////////////////////////////////

export const AssaySchema = z.object({
  pcr_0_1: DeadBooleanSchema,
  id: z.number().int(),
  assay_name: z.string(),
  pcr_primer_forward: z.string(),
  pcr_primer_reverse: z.string(),
  sterilise_method: z.string().nullish(),
  thermocycler: z.string().nullish(),
  amplificationReactionVolume: z.coerce.number().nullish(),
  assay_validation: z.string().nullish(),
  targetTaxonomicAssay: z.string(),
  targetTaxonomicScope: z.string().nullish(),
  target_gene: z.string(),
  target_subfragment: z.string().nullish(),
  ampliconSize: z.number().array().max(2),
  pcr_primer_vol_forward: z.coerce.number().nullish(),
  pcr_primer_vol_reverse: z.coerce.number().nullish(),
  pcr_primer_conc_forward: z.coerce.number().nullish(),
  pcr_primer_conc_reverse: z.coerce.number().nullish(),
  probeReporter: z.string().nullish(),
  probeQuencher: z.string().nullish(),
  probe_seq: z.string().nullish(),
  probe_ref: z.string().nullish(),
  probe_conc: z.coerce.number().nullish(),
  commercial_mm: z.string().nullish(),
  custom_mm: z.string().nullish(),
  pcr_dna_vol: z.coerce.number().nullish(),
  pcr_rep: z.coerce.number().int().nullish(),
  nucl_acid_amp: z.string().nullish(),
  pcr_cond: z.string().nullish(),
  annealingTemp: z.string().nullish(),
  pcr_cycles: z.coerce.number().nullish(),
  pcr_analysis_software: z.string().nullish(),
  pcr_method_additional: z.string().nullish(),
  assay_type: z.string(),
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
  ampliconSize: z.number().array().max(2).optional(),
}))

export type AssayOptionalDefaults = z.infer<typeof AssayOptionalDefaultsSchema>

// ASSAY RELATION SCHEMA
//------------------------------------------------------

export type AssayRelations = {
  Samples: SampleWithRelations[];
  Primer: PrimerWithRelations;
  Libraries: LibraryWithRelations[];
  Analyses: AnalysisWithRelations[];
};

export type AssayWithRelations = z.infer<typeof AssaySchema> & AssayRelations

export const AssayWithRelationsSchema: z.ZodType<AssayWithRelations> = AssaySchema.merge(z.object({
  Samples: z.lazy(() => SampleWithRelationsSchema).array(),
  Primer: z.lazy(() => PrimerWithRelationsSchema),
  Libraries: z.lazy(() => LibraryWithRelationsSchema).array(),
  Analyses: z.lazy(() => AnalysisWithRelationsSchema).array(),
}))

// ASSAY OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type AssayOptionalDefaultsRelations = {
  Samples: SampleOptionalDefaultsWithRelations[];
  Primer: PrimerOptionalDefaultsWithRelations;
  Libraries: LibraryOptionalDefaultsWithRelations[];
  Analyses: AnalysisOptionalDefaultsWithRelations[];
};

export type AssayOptionalDefaultsWithRelations = z.infer<typeof AssayOptionalDefaultsSchema> & AssayOptionalDefaultsRelations

export const AssayOptionalDefaultsWithRelationsSchema: z.ZodType<AssayOptionalDefaultsWithRelations> = AssayOptionalDefaultsSchema.merge(z.object({
  Samples: z.lazy(() => SampleOptionalDefaultsWithRelationsSchema).array(),
  Primer: z.lazy(() => PrimerOptionalDefaultsWithRelationsSchema),
  Libraries: z.lazy(() => LibraryOptionalDefaultsWithRelationsSchema).array(),
  Analyses: z.lazy(() => AnalysisOptionalDefaultsWithRelationsSchema).array(),
}))

// ASSAY PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type AssayPartialRelations = {
  Samples?: SamplePartialWithRelations[];
  Primer?: PrimerPartialWithRelations;
  Libraries?: LibraryPartialWithRelations[];
  Analyses?: AnalysisPartialWithRelations[];
};

export type AssayPartialWithRelations = z.infer<typeof AssayPartialSchema> & AssayPartialRelations

export const AssayPartialWithRelationsSchema: z.ZodType<AssayPartialWithRelations> = AssayPartialSchema.merge(z.object({
  Samples: z.lazy(() => SamplePartialWithRelationsSchema).array(),
  Primer: z.lazy(() => PrimerPartialWithRelationsSchema),
  Libraries: z.lazy(() => LibraryPartialWithRelationsSchema).array(),
  Analyses: z.lazy(() => AnalysisPartialWithRelationsSchema).array(),
})).partial()

export type AssayOptionalDefaultsWithPartialRelations = z.infer<typeof AssayOptionalDefaultsSchema> & AssayPartialRelations

export const AssayOptionalDefaultsWithPartialRelationsSchema: z.ZodType<AssayOptionalDefaultsWithPartialRelations> = AssayOptionalDefaultsSchema.merge(z.object({
  Samples: z.lazy(() => SamplePartialWithRelationsSchema).array(),
  Primer: z.lazy(() => PrimerPartialWithRelationsSchema),
  Libraries: z.lazy(() => LibraryPartialWithRelationsSchema).array(),
  Analyses: z.lazy(() => AnalysisPartialWithRelationsSchema).array(),
}).partial())

export type AssayWithPartialRelations = z.infer<typeof AssaySchema> & AssayPartialRelations

export const AssayWithPartialRelationsSchema: z.ZodType<AssayWithPartialRelations> = AssaySchema.merge(z.object({
  Samples: z.lazy(() => SamplePartialWithRelationsSchema).array(),
  Primer: z.lazy(() => PrimerPartialWithRelationsSchema),
  Libraries: z.lazy(() => LibraryPartialWithRelationsSchema).array(),
  Analyses: z.lazy(() => AnalysisPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// PRIMER SCHEMA
/////////////////////////////////////////

export const PrimerSchema = z.object({
  id: z.number().int(),
  pcr_primer_forward: z.string(),
  pcr_primer_reverse: z.string(),
  pcr_primer_name_forward: z.string(),
  pcr_primer_name_reverse: z.string(),
  pcr_primer_reference_forward: z.string().nullish(),
  pcr_primer_reference_reverse: z.string().nullish(),
})

export type Primer = z.infer<typeof PrimerSchema>

/////////////////////////////////////////
// PRIMER PARTIAL SCHEMA
/////////////////////////////////////////

export const PrimerPartialSchema = PrimerSchema.partial()

export type PrimerPartial = z.infer<typeof PrimerPartialSchema>

// PRIMER OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const PrimerOptionalDefaultsSchema = PrimerSchema.merge(z.object({
  id: z.number().int().optional(),
}))

export type PrimerOptionalDefaults = z.infer<typeof PrimerOptionalDefaultsSchema>

// PRIMER RELATION SCHEMA
//------------------------------------------------------

export type PrimerRelations = {
  Assays: AssayWithRelations[];
};

export type PrimerWithRelations = z.infer<typeof PrimerSchema> & PrimerRelations

export const PrimerWithRelationsSchema: z.ZodType<PrimerWithRelations> = PrimerSchema.merge(z.object({
  Assays: z.lazy(() => AssayWithRelationsSchema).array(),
}))

// PRIMER OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type PrimerOptionalDefaultsRelations = {
  Assays: AssayOptionalDefaultsWithRelations[];
};

export type PrimerOptionalDefaultsWithRelations = z.infer<typeof PrimerOptionalDefaultsSchema> & PrimerOptionalDefaultsRelations

export const PrimerOptionalDefaultsWithRelationsSchema: z.ZodType<PrimerOptionalDefaultsWithRelations> = PrimerOptionalDefaultsSchema.merge(z.object({
  Assays: z.lazy(() => AssayOptionalDefaultsWithRelationsSchema).array(),
}))

// PRIMER PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type PrimerPartialRelations = {
  Assays?: AssayPartialWithRelations[];
};

export type PrimerPartialWithRelations = z.infer<typeof PrimerPartialSchema> & PrimerPartialRelations

export const PrimerPartialWithRelationsSchema: z.ZodType<PrimerPartialWithRelations> = PrimerPartialSchema.merge(z.object({
  Assays: z.lazy(() => AssayPartialWithRelationsSchema).array(),
})).partial()

export type PrimerOptionalDefaultsWithPartialRelations = z.infer<typeof PrimerOptionalDefaultsSchema> & PrimerPartialRelations

export const PrimerOptionalDefaultsWithPartialRelationsSchema: z.ZodType<PrimerOptionalDefaultsWithPartialRelations> = PrimerOptionalDefaultsSchema.merge(z.object({
  Assays: z.lazy(() => AssayPartialWithRelationsSchema).array(),
}).partial())

export type PrimerWithPartialRelations = z.infer<typeof PrimerSchema> & PrimerPartialRelations

export const PrimerWithPartialRelationsSchema: z.ZodType<PrimerWithPartialRelations> = PrimerSchema.merge(z.object({
  Assays: z.lazy(() => AssayPartialWithRelationsSchema).array(),
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
  assay_name: z.string(),
  samp_name: z.string(),
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
  input_read_count: z.coerce.number().int().nullish(),
  checksum_filename: z.string().nullish(),
  checksum_filename2: z.string().nullish(),
  lib_conc: z.coerce.number().nullish(),
  lib_conc_meth: z.string().nullish(),
  lib_conc_unit: z.string().nullish(),
  phix_perc: z.coerce.number().nullish(),
  checksum_method: z.string().nullish(),
  pcr2_amplificationReactionVolume: z.coerce.number().nullish(),
  pcr2_analysis_software: z.string().nullish(),
  pcr2_annealingTemp: z.coerce.number().nullish(),
  pcr2_commercial_mm: z.string().nullish(),
  pcr2_cond: z.string().nullish(),
  pcr2_custom_mm: z.string().nullish(),
  pcr2_cycles: z.coerce.number().int().nullish(),
  pcr2_dna_vol: z.coerce.number().nullish(),
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
  Assay: AssayWithRelations;
  Sample: SampleWithRelations;
};

export type LibraryWithRelations = Omit<z.infer<typeof LibrarySchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & LibraryRelations

export const LibraryWithRelationsSchema: z.ZodType<LibraryWithRelations> = LibrarySchema.merge(z.object({
  Assay: z.lazy(() => AssayWithRelationsSchema),
  Sample: z.lazy(() => SampleWithRelationsSchema),
}))

// LIBRARY OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type LibraryOptionalDefaultsRelations = {
  Assay: AssayOptionalDefaultsWithRelations;
  Sample: SampleOptionalDefaultsWithRelations;
};

export type LibraryOptionalDefaultsWithRelations = Omit<z.infer<typeof LibraryOptionalDefaultsSchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & LibraryOptionalDefaultsRelations

export const LibraryOptionalDefaultsWithRelationsSchema: z.ZodType<LibraryOptionalDefaultsWithRelations> = LibraryOptionalDefaultsSchema.merge(z.object({
  Assay: z.lazy(() => AssayOptionalDefaultsWithRelationsSchema),
  Sample: z.lazy(() => SampleOptionalDefaultsWithRelationsSchema),
}))

// LIBRARY PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type LibraryPartialRelations = {
  Assay?: AssayPartialWithRelations;
  Sample?: SamplePartialWithRelations;
};

export type LibraryPartialWithRelations = Omit<z.infer<typeof LibraryPartialSchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & LibraryPartialRelations

export const LibraryPartialWithRelationsSchema: z.ZodType<LibraryPartialWithRelations> = LibraryPartialSchema.merge(z.object({
  Assay: z.lazy(() => AssayPartialWithRelationsSchema),
  Sample: z.lazy(() => SamplePartialWithRelationsSchema),
})).partial()

export type LibraryOptionalDefaultsWithPartialRelations = Omit<z.infer<typeof LibraryOptionalDefaultsSchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & LibraryPartialRelations

export const LibraryOptionalDefaultsWithPartialRelationsSchema: z.ZodType<LibraryOptionalDefaultsWithPartialRelations> = LibraryOptionalDefaultsSchema.merge(z.object({
  Assay: z.lazy(() => AssayPartialWithRelationsSchema),
  Sample: z.lazy(() => SamplePartialWithRelationsSchema),
}).partial())

export type LibraryWithPartialRelations = Omit<z.infer<typeof LibrarySchema>, "userDefined"> & {
  userDefined?: JsonValueType | null;
} & LibraryPartialRelations

export const LibraryWithPartialRelationsSchema: z.ZodType<LibraryWithPartialRelations> = LibrarySchema.merge(z.object({
  Assay: z.lazy(() => AssayPartialWithRelationsSchema),
  Sample: z.lazy(() => SamplePartialWithRelationsSchema),
}).partial())
