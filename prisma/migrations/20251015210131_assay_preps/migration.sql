/*
  Warnings:

  - You are about to drop the column `amplificationReactionVolume` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `annealingTemp` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `assay_type` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `assay_validation` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `commercial_mm` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `custom_mm` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `nucl_acid_amp` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `pcr_0_1` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `pcr_analysis_software` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `pcr_cond` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `pcr_cycles` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `pcr_dna_vol` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `pcr_method_additional` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `pcr_primer_conc_forward` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `pcr_primer_conc_reverse` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `pcr_primer_vol_forward` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `pcr_primer_vol_reverse` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `pcr_rep` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `probeQuencher` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `probeReporter` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `probe_conc` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `probe_ref` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `probe_seq` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `sterilise_method` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `thermocycler` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the `Primer` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[pcr_primer_forward,pcr_primer_reverse]` on the table `Assay` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pcr_primer_name_forward,pcr_primer_name_reverse]` on the table `Assay` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pcr_primer_name_forward` to the `Assay` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pcr_primer_name_reverse` to the `Assay` table without a default value. This is not possible if the table is not empty.
  - Added the required column `project_id` to the `Library` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Analysis" DROP CONSTRAINT "Analysis_assay_name_fkey";

-- DropForeignKey
ALTER TABLE "public"."Assay" DROP CONSTRAINT "Assay_pcr_primer_forward_pcr_primer_reverse_fkey";

-- DropForeignKey
ALTER TABLE "public"."Library" DROP CONSTRAINT "Library_assay_name_fkey";

-- AlterTable
ALTER TABLE "public"."Assay" DROP COLUMN "amplificationReactionVolume",
DROP COLUMN "annealingTemp",
DROP COLUMN "assay_type",
DROP COLUMN "assay_validation",
DROP COLUMN "commercial_mm",
DROP COLUMN "custom_mm",
DROP COLUMN "nucl_acid_amp",
DROP COLUMN "pcr_0_1",
DROP COLUMN "pcr_analysis_software",
DROP COLUMN "pcr_cond",
DROP COLUMN "pcr_cycles",
DROP COLUMN "pcr_dna_vol",
DROP COLUMN "pcr_method_additional",
DROP COLUMN "pcr_primer_conc_forward",
DROP COLUMN "pcr_primer_conc_reverse",
DROP COLUMN "pcr_primer_vol_forward",
DROP COLUMN "pcr_primer_vol_reverse",
DROP COLUMN "pcr_rep",
DROP COLUMN "probeQuencher",
DROP COLUMN "probeReporter",
DROP COLUMN "probe_conc",
DROP COLUMN "probe_ref",
DROP COLUMN "probe_seq",
DROP COLUMN "sterilise_method",
DROP COLUMN "thermocycler",
ADD COLUMN     "deleted_ODE" BOOLEAN,
ADD COLUMN     "pcr_primer_name_forward" TEXT NOT NULL,
ADD COLUMN     "pcr_primer_name_reverse" TEXT NOT NULL,
ADD COLUMN     "pcr_primer_reference_forward" TEXT,
ADD COLUMN     "pcr_primer_reference_reverse" TEXT;

-- AlterTable
ALTER TABLE "public"."Library" ADD COLUMN     "project_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Sample" ADD COLUMN     "sterilise_method" TEXT;

-- DropTable
DROP TABLE "public"."Primer";

-- CreateTable
CREATE TABLE "public"."AssayPrep" (
    "id" SERIAL NOT NULL,
    "project_id" TEXT NOT NULL,
    "assay_name" TEXT NOT NULL,
    "thermocycler" TEXT,
    "commercial_mm" TEXT,
    "custom_mm" TEXT,
    "pcr_cond" TEXT,
    "nucl_acid_amp" TEXT,
    "pcr_0_1" "public"."DeadBoolean" NOT NULL,
    "amplificationReactionVolume" DOUBLE PRECISION,
    "assay_validation" TEXT,
    "pcr_primer_vol_forward" DOUBLE PRECISION,
    "pcr_primer_vol_reverse" DOUBLE PRECISION,
    "pcr_primer_conc_forward" DOUBLE PRECISION,
    "pcr_primer_conc_reverse" DOUBLE PRECISION,
    "probeReporter" TEXT,
    "probeQuencher" TEXT,
    "probe_seq" TEXT,
    "probe_ref" TEXT,
    "probe_conc" DOUBLE PRECISION,
    "pcr_dna_vol" DOUBLE PRECISION,
    "pcr_rep" INTEGER,
    "annealingTemp" TEXT,
    "pcr_cycles" DOUBLE PRECISION,
    "pcr_analysis_software" TEXT,
    "pcr_method_additional" TEXT,
    "assay_type" TEXT NOT NULL,

    CONSTRAINT "AssayPrep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssayPrep_project_id_assay_name_key" ON "public"."AssayPrep"("project_id", "assay_name");

-- CreateIndex
CREATE UNIQUE INDEX "Assay_pcr_primer_forward_pcr_primer_reverse_key" ON "public"."Assay"("pcr_primer_forward", "pcr_primer_reverse");

-- CreateIndex
CREATE UNIQUE INDEX "Assay_pcr_primer_name_forward_pcr_primer_name_reverse_key" ON "public"."Assay"("pcr_primer_name_forward", "pcr_primer_name_reverse");

-- AddForeignKey
ALTER TABLE "public"."Analysis" ADD CONSTRAINT "Analysis_assay_name_fkey" FOREIGN KEY ("assay_name") REFERENCES "public"."Assay"("assay_name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssayPrep" ADD CONSTRAINT "AssayPrep_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssayPrep" ADD CONSTRAINT "AssayPrep_assay_name_fkey" FOREIGN KEY ("assay_name") REFERENCES "public"."Assay"("assay_name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Library" ADD CONSTRAINT "Library_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Library" ADD CONSTRAINT "Library_assay_name_fkey" FOREIGN KEY ("assay_name") REFERENCES "public"."Assay"("assay_name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Library" ADD CONSTRAINT "Library_project_id_assay_name_fkey" FOREIGN KEY ("project_id", "assay_name") REFERENCES "public"."AssayPrep"("project_id", "assay_name") ON DELETE CASCADE ON UPDATE CASCADE;
