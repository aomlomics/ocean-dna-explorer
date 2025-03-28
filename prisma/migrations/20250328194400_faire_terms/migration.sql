/*
  Warnings:

  - You are about to drop the column `pcr_plate_id` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `rel_cont_id` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `library_id` on the `Library` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[lib_id]` on the table `Library` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `assay_type` to the `Assay` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lib_id` to the `Library` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "lib_conc_unit" AS ENUM ('ng/µL', 'nM', 'pM', 'other');

-- CreateEnum
CREATE TYPE "checksum_method" AS ENUM ('MD5', 'SHA-256', 'CRC-32', 'other');

-- CreateEnum
CREATE TYPE "assay_type" AS ENUM ('targeted', 'metabarcoding', 'other');

-- CreateEnum
CREATE TYPE "diss_inorg_carb_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'µmol/kg', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "diss_inorg_nitro_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'µmol/kg', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "diss_org_carb_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'µmol/kg', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "diss_org_nitro_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'µmol/kg', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "diss_oxygen_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'mL/L', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "nitrate_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'µmol/kg', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "nitrite_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'µmol/kg', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "nitro_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'µmol/kg', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "org_carb_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'µmol/kg', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "org_matter_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'µmol/kg', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "org_nitro_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'µmol/kg', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "part_org_carb_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'µmol/kg', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "part_org_nitro_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'µmol/kg', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "tot_carb_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'µmol/kg', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "tot_diss_nitro_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'µmol/kg', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "tot_inorg_nitro_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'µmol/kg', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "tot_nitro_content_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'µmol/kg', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "tot_nitro_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'µmol/kg', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "tot_org_carb_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'µmol/kg', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "tot_part_carb_unit" AS ENUM ('µM', 'mol/m3', 'mmol/m3', 'µmol/m3', 'mol/L', 'mmol/L', 'µmol/L', 'mg/L', 'µg/L', 'µmol/kg', 'mmol/kg', 'parts per million', 'other');

-- CreateEnum
CREATE TYPE "concentration_unit" AS ENUM ('ng/µl', 'copies/µl', 'other');

-- CreateEnum
CREATE TYPE "pump_flow_rate_unit" AS ENUM ('m3/s', 'm3/min', 'm3/h', 'L/s', 'L/min', 'L/h', 'other');

-- DropIndex
DROP INDEX "Library_library_id_key";

-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "otu_final_description" TEXT,
ADD COLUMN     "otu_num_tax_assigned" INTEGER,
ADD COLUMN     "otu_raw_description" TEXT,
ADD COLUMN     "output_otu_num" INTEGER,
ADD COLUMN     "output_read_count" INTEGER;

-- AlterTable
ALTER TABLE "Assay" DROP COLUMN "pcr_plate_id",
DROP COLUMN "rel_cont_id",
ADD COLUMN     "assay_type" TEXT NOT NULL,
ALTER COLUMN "neg_cont_type" DROP NOT NULL,
ALTER COLUMN "pos_cont_type" DROP NOT NULL,
ALTER COLUMN "targetTaxonomicAssay" DROP NOT NULL,
ALTER COLUMN "pcr_primer_forward" DROP NOT NULL,
ALTER COLUMN "pcr_primer_reverse" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Library" DROP COLUMN "library_id",
ADD COLUMN     "block_ref" TEXT,
ADD COLUMN     "block_seq" TEXT,
ADD COLUMN     "block_taxa" TEXT,
ADD COLUMN     "checksum_filename" TEXT,
ADD COLUMN     "checksum_filename2" TEXT,
ADD COLUMN     "checksum_method" TEXT,
ADD COLUMN     "inhibition_check" TEXT,
ADD COLUMN     "inhibition_check_0_1" "DeadBoolean",
ADD COLUMN     "lib_conc" DOUBLE PRECISION,
ADD COLUMN     "lib_conc_meth" TEXT,
ADD COLUMN     "lib_conc_unit" TEXT,
ADD COLUMN     "lib_id" TEXT NOT NULL,
ADD COLUMN     "pcr2_amplificationReactionVolume" DOUBLE PRECISION,
ADD COLUMN     "pcr2_analysis_software" TEXT,
ADD COLUMN     "pcr2_annealingTemp" DOUBLE PRECISION,
ADD COLUMN     "pcr2_commercial_mm" TEXT,
ADD COLUMN     "pcr2_cond" TEXT,
ADD COLUMN     "pcr2_custom_mm" TEXT,
ADD COLUMN     "pcr2_cycles" INTEGER,
ADD COLUMN     "pcr2_dna_vol" DOUBLE PRECISION,
ADD COLUMN     "pcr2_method_additional" TEXT,
ADD COLUMN     "pcr2_plate_id" TEXT,
ADD COLUMN     "pcr2_thermocycler" TEXT,
ADD COLUMN     "pcr_plate_id" TEXT,
ADD COLUMN     "phix_perc" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "biological_rep" INTEGER,
ADD COLUMN     "neg_cont_0_1" "DeadBoolean",
ADD COLUMN     "parent_project_id" TEXT,
ADD COLUMN     "pos_cont_0_1" "DeadBoolean";

-- AlterTable
ALTER TABLE "Sample" ADD COLUMN     "concentration_unit" TEXT,
ADD COLUMN     "date_ext" TEXT,
ADD COLUMN     "diss_inorg_carb_unit" TEXT,
ADD COLUMN     "diss_inorg_nitro_unit" TEXT,
ADD COLUMN     "diss_org_carb_unit" TEXT,
ADD COLUMN     "diss_org_nitro_unit" TEXT,
ADD COLUMN     "diss_oxygen_unit" TEXT,
ADD COLUMN     "dna_store_loc" TEXT,
ADD COLUMN     "nitrate_unit" TEXT,
ADD COLUMN     "nitrite_unit" TEXT,
ADD COLUMN     "nitro_unit" TEXT,
ADD COLUMN     "org_carb_unit" TEXT,
ADD COLUMN     "org_matter_unit" TEXT,
ADD COLUMN     "org_nitro_unit" TEXT,
ADD COLUMN     "part_org_carb_unit" TEXT,
ADD COLUMN     "part_org_nitro_unit" TEXT,
ADD COLUMN     "prefilter_material" TEXT,
ADD COLUMN     "pump_flow_rate" DOUBLE PRECISION,
ADD COLUMN     "pump_flow_rate_unit" TEXT,
ADD COLUMN     "rel_cont_id" TEXT,
ADD COLUMN     "samp_store_loc" TEXT,
ADD COLUMN     "stationed_sample_dur" TEXT,
ADD COLUMN     "tot_carb_unit" TEXT,
ADD COLUMN     "tot_diss_nitro_unit" TEXT,
ADD COLUMN     "tot_inorg_nitro_unit" TEXT,
ADD COLUMN     "tot_nitro_content_unit" TEXT,
ADD COLUMN     "tot_nitro_unit" TEXT,
ADD COLUMN     "tot_org_carb_unit" TEXT,
ADD COLUMN     "tot_part_carb_unit" TEXT,
ALTER COLUMN "decimalLatitude" DROP NOT NULL,
ALTER COLUMN "decimalLongitude" DROP NOT NULL,
ALTER COLUMN "env_broad_scale" DROP NOT NULL,
ALTER COLUMN "env_local_scale" DROP NOT NULL,
ALTER COLUMN "env_medium" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Library_lib_id_key" ON "Library"("lib_id");
