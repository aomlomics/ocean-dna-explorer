/*
  Warnings:

  - You are about to drop the column `repseq_max_length` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `repseq_min_abundance` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `repseq_min_length` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `repseq_min_prevalence` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `neg_cont_type` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `pcr_primer_name_forward` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `pcr_primer_name_reverse` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `pcr_primer_reference_forward` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `pcr_primer_reference_reverse` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `pos_cont_type` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `biosample_accession` on the `Library` table. All the data in the column will be lost.
  - You are about to drop the column `detection_type` on the `Project` table. All the data in the column will be lost.
  - Added the required column `isPrivate` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isPrivate` to the `Assay` table without a default value. This is not possible if the table is not empty.
  - Made the column `pcr_primer_forward` on table `Assay` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pcr_primer_reverse` on table `Assay` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `isPrivate` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isPrivate` to the `Feature` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isPrivate` to the `Library` table without a default value. This is not possible if the table is not empty.
  - Made the column `seq_run_id` on table `Library` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `isPrivate` to the `Occurrence` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isPrivate` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isPrivate` to the `Sample` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isPrivate` to the `Taxonomy` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ammonium_unit" AS ENUM ('micromole per liter', 'milligram per liter', 'parts per million');

-- CreateEnum
CREATE TYPE "phosphate_unit" AS ENUM ('micromole per liter');

-- CreateEnum
CREATE TYPE "pressure_unit" AS ENUM ('atmosphere');

-- CreateEnum
CREATE TYPE "silicate_unit" AS ENUM ('micromole per liter');

-- AlterTable
ALTER TABLE "Analysis" DROP COLUMN "repseq_max_length",
DROP COLUMN "repseq_min_abundance",
DROP COLUMN "repseq_min_length",
DROP COLUMN "repseq_min_prevalence",
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL,
ADD COLUMN     "min_consensus" DOUBLE PRECISION,
ADD COLUMN     "qiime2_version" TEXT,
ADD COLUMN     "repseqs_max_length" INTEGER,
ADD COLUMN     "repseqs_min_abundance" DOUBLE PRECISION,
ADD COLUMN     "repseqs_min_length" INTEGER,
ADD COLUMN     "repseqs_min_prevalence" DOUBLE PRECISION,
ADD COLUMN     "skl_confidence" DOUBLE PRECISION,
ADD COLUMN     "tourmaline_asv_method" TEXT;

-- AlterTable
ALTER TABLE "Assay" DROP COLUMN "neg_cont_type",
DROP COLUMN "pcr_primer_name_forward",
DROP COLUMN "pcr_primer_name_reverse",
DROP COLUMN "pcr_primer_reference_forward",
DROP COLUMN "pcr_primer_reference_reverse",
DROP COLUMN "pos_cont_type",
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL,
ALTER COLUMN "pcr_primer_forward" SET NOT NULL,
ALTER COLUMN "pcr_primer_reverse" SET NOT NULL;

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "Feature" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "Library" DROP COLUMN "biosample_accession",
ADD COLUMN     "associatedSequences" TEXT,
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL,
ADD COLUMN     "seq_samp_id" TEXT,
ALTER COLUMN "seq_run_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "Occurrence" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "detection_type",
ADD COLUMN     "bioproject_accession" TEXT,
ADD COLUMN     "expedition_id" TEXT,
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL,
ADD COLUMN     "ship_crs_expocode" TEXT,
ADD COLUMN     "woce_sect" TEXT;

-- AlterTable
ALTER TABLE "Sample" ADD COLUMN     "ammonium" TEXT,
ADD COLUMN     "ammonium_unit" TEXT,
ADD COLUMN     "biosample_accession" TEXT,
ADD COLUMN     "carbonate" DOUBLE PRECISION,
ADD COLUMN     "carbonate_unit" TEXT,
ADD COLUMN     "ctd_bottle_number" TEXT,
ADD COLUMN     "ctd_cast_number" TEXT,
ADD COLUMN     "dna_yield" DOUBLE PRECISION,
ADD COLUMN     "dna_yield_unit" TEXT,
ADD COLUMN     "extract_id" TEXT,
ADD COLUMN     "extract_plate" TEXT,
ADD COLUMN     "extract_well_number" INTEGER,
ADD COLUMN     "extract_well_position" TEXT,
ADD COLUMN     "hydrogen_ion" DOUBLE PRECISION,
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL,
ADD COLUMN     "line_id" TEXT,
ADD COLUMN     "materialSampleID" TEXT,
ADD COLUMN     "neg_cont_type" TEXT,
ADD COLUMN     "nitrate_plus_nitrite" DOUBLE PRECISION,
ADD COLUMN     "nitrate_plus_nitrite_unit" TEXT,
ADD COLUMN     "omega_arag" DOUBLE PRECISION,
ADD COLUMN     "organism" TEXT,
ADD COLUMN     "pco2" INTEGER,
ADD COLUMN     "pco2_unit" TEXT,
ADD COLUMN     "phosphate" DOUBLE PRECISION,
ADD COLUMN     "phosphate_unit" TEXT,
ADD COLUMN     "pos_cont_type" TEXT,
ADD COLUMN     "pressure" INTEGER,
ADD COLUMN     "pressure_unit" TEXT,
ADD COLUMN     "replicate_number" TEXT,
ADD COLUMN     "samp_collect_notes" TEXT,
ADD COLUMN     "serial_number" TEXT,
ADD COLUMN     "silicate" DOUBLE PRECISION,
ADD COLUMN     "silicate_unit" TEXT,
ADD COLUMN     "station_id" TEXT,
ADD COLUMN     "tot_alkalinity" DOUBLE PRECISION,
ADD COLUMN     "tot_alkalinity_unit" TEXT,
ADD COLUMN     "transmittance" DOUBLE PRECISION,
ADD COLUMN     "transmittance_unit" TEXT;

-- AlterTable
ALTER TABLE "Taxonomy" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL;

-- CreateTable
CREATE TABLE "Primer" (
    "id" SERIAL NOT NULL,
    "isPrivate" BOOLEAN NOT NULL,
    "pcr_primer_forward" TEXT NOT NULL,
    "pcr_primer_reverse" TEXT NOT NULL,
    "pcr_primer_name_forward" TEXT NOT NULL,
    "pcr_primer_name_reverse" TEXT NOT NULL,
    "pcr_primer_reference_forward" TEXT,
    "pcr_primer_reference_reverse" TEXT,

    CONSTRAINT "Primer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Primer_pcr_primer_forward_pcr_primer_reverse_key" ON "Primer"("pcr_primer_forward", "pcr_primer_reverse");

-- AddForeignKey
ALTER TABLE "Assay" ADD CONSTRAINT "Assay_pcr_primer_forward_pcr_primer_reverse_fkey" FOREIGN KEY ("pcr_primer_forward", "pcr_primer_reverse") REFERENCES "Primer"("pcr_primer_forward", "pcr_primer_reverse") ON DELETE CASCADE ON UPDATE CASCADE;
