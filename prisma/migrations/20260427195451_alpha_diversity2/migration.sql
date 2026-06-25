/*
  Warnings:

  - You are about to drop the column `division` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `domain` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `subdivision` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `supergroup` on the `Taxonomy` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Occurrence" DROP CONSTRAINT "Occurrence_analysis_run_name_featureid_fkey";

-- AlterTable
ALTER TABLE "AlphaDiversity" ADD COLUMN     "finished" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Taxonomy" DROP COLUMN "division",
DROP COLUMN "domain",
DROP COLUMN "subdivision",
DROP COLUMN "supergroup",
ADD COLUMN     "higherClassification" TEXT;

-- DropEnum
DROP TYPE "ammonium_unit";

-- DropEnum
DROP TYPE "barcoding_pcr_appr";

-- DropEnum
DROP TYPE "checksum_method";

-- DropEnum
DROP TYPE "concentration_unit";

-- DropEnum
DROP TYPE "dada2_chimera_method";

-- DropEnum
DROP TYPE "dada2_pooling_method";

-- DropEnum
DROP TYPE "detection_type";

-- DropEnum
DROP TYPE "diss_inorg_carb_unit";

-- DropEnum
DROP TYPE "diss_inorg_nitro_unit";

-- DropEnum
DROP TYPE "diss_org_carb_unit";

-- DropEnum
DROP TYPE "diss_org_nitro_unit";

-- DropEnum
DROP TYPE "diss_oxygen_unit";

-- DropEnum
DROP TYPE "error_rate_type";

-- DropEnum
DROP TYPE "eventDurationUnit";

-- DropEnum
DROP TYPE "filter_material";

-- DropEnum
DROP TYPE "lib_conc_unit";

-- DropEnum
DROP TYPE "lib_layout";

-- DropEnum
DROP TYPE "min_reads_cutoff_unit";

-- DropEnum
DROP TYPE "neg_cont_type";

-- DropEnum
DROP TYPE "nitrate_unit";

-- DropEnum
DROP TYPE "nitrite_unit";

-- DropEnum
DROP TYPE "nitro_unit";

-- DropEnum
DROP TYPE "nucl_acid_ext_lysis";

-- DropEnum
DROP TYPE "nucl_acid_ext_sep";

-- DropEnum
DROP TYPE "org_carb_unit";

-- DropEnum
DROP TYPE "org_matter_unit";

-- DropEnum
DROP TYPE "org_nitro_unit";

-- DropEnum
DROP TYPE "part_org_carb_unit";

-- DropEnum
DROP TYPE "part_org_nitro_unit";

-- DropEnum
DROP TYPE "phosphate_unit";

-- DropEnum
DROP TYPE "platform";

-- DropEnum
DROP TYPE "precip_chem_prep";

-- DropEnum
DROP TYPE "prepped_samp_store_sol";

-- DropEnum
DROP TYPE "pressure_unit";

-- DropEnum
DROP TYPE "probeQuencher";

-- DropEnum
DROP TYPE "pump_flow_rate_unit";

-- DropEnum
DROP TYPE "samp_category";

-- DropEnum
DROP TYPE "samp_size_unit";

-- DropEnum
DROP TYPE "samp_store_sol";

-- DropEnum
DROP TYPE "samp_vol_we_dna_ext_unit";

-- DropEnum
DROP TYPE "silicate_unit";

-- DropEnum
DROP TYPE "tax_assign_cat";

-- DropEnum
DROP TYPE "tot_carb_unit";

-- DropEnum
DROP TYPE "tot_diss_nitro_unit";

-- DropEnum
DROP TYPE "tot_inorg_nitro_unit";

-- DropEnum
DROP TYPE "tot_nitro_content_unit";

-- DropEnum
DROP TYPE "tot_nitro_unit";

-- DropEnum
DROP TYPE "tot_org_carb_unit";

-- DropEnum
DROP TYPE "tot_part_carb_unit";

-- DropEnum
DROP TYPE "tourmaline_classify_method";

-- DropEnum
DROP TYPE "verbatimCoordinateSystem";

-- DropEnum
DROP TYPE "verbatimSRS";

-- CreateIndex
CREATE INDEX "Library_project_id_assay_name_idx" ON "Library"("project_id", "assay_name");

-- CreateIndex
CREATE INDEX "Occurrence_analysis_run_name_featureid_idx" ON "Occurrence"("analysis_run_name", "featureid");

-- AddForeignKey
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_analysis_run_name_featureid_fkey" FOREIGN KEY ("analysis_run_name", "featureid") REFERENCES "Assignment"("analysis_run_name", "featureid") ON DELETE CASCADE ON UPDATE CASCADE;
