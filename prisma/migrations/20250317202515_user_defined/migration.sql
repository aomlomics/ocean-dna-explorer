/*
  Warnings:

  - The values [not collected,not provided,missing] on the enum `DeadBoolean` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `associatedSequences` on the `Library` table. All the data in the column will be lost.
  - You are about to drop the column `seq_samp_id` on the `Library` table. All the data in the column will be lost.
  - You are about to drop the column `expedition_id` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `ammonium` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `ctd_bottle_number` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `ctd_cast_number` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `extract_id` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `line_id` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `materialSampleID` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `phaeopigments` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `phosphate` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `replicate_number` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `serial_number` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `silicate` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `station_id` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the `Change` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `changes` to the `Edit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeadBoolean_new" AS ENUM ('false', 'true', 'not applicable: control sample', 'not applicable: sample group', 'not applicable', 'missing: not collected: synthetic construct', 'missing: not collected: lab stock', 'missing: not collected: third party data', 'missing: not collected', 'missing: not provided: data agreement established pre-2023', 'missing: not provided', 'missing: restricted access: endangered species', 'missing: restricted access: human-identifiable', 'missing: restricted access');
ALTER TABLE "Sample" ALTER COLUMN "habitat_natural_artificial_0_1" TYPE "DeadBoolean_new" USING ("habitat_natural_artificial_0_1"::text::"DeadBoolean_new");
ALTER TABLE "Sample" ALTER COLUMN "filter_passive_active_0_1" TYPE "DeadBoolean_new" USING ("filter_passive_active_0_1"::text::"DeadBoolean_new");
ALTER TABLE "Sample" ALTER COLUMN "dna_cleanup_0_1" TYPE "DeadBoolean_new" USING ("dna_cleanup_0_1"::text::"DeadBoolean_new");
ALTER TABLE "Assay" ALTER COLUMN "pcr_0_1" TYPE "DeadBoolean_new" USING ("pcr_0_1"::text::"DeadBoolean_new");
ALTER TABLE "Analysis" ALTER COLUMN "deblur_sample_stats" TYPE "DeadBoolean_new" USING ("deblur_sample_stats"::text::"DeadBoolean_new");
ALTER TABLE "Analysis" ALTER COLUMN "discard_untrimmed" TYPE "DeadBoolean_new" USING ("discard_untrimmed"::text::"DeadBoolean_new");
ALTER TYPE "DeadBoolean" RENAME TO "DeadBoolean_old";
ALTER TYPE "DeadBoolean_new" RENAME TO "DeadBoolean";
DROP TYPE "DeadBoolean_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Change" DROP CONSTRAINT "Change_editId_fkey";

-- DropForeignKey
ALTER TABLE "Edit" DROP CONSTRAINT "Edit_analysis_run_name_fkey";

-- DropForeignKey
ALTER TABLE "Edit" DROP CONSTRAINT "Edit_project_id_fkey";

-- AlterTable
ALTER TABLE "Edit" ADD COLUMN     "changes" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Library" DROP COLUMN "associatedSequences",
DROP COLUMN "seq_samp_id",
ADD COLUMN     "userDefined" JSONB;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "expedition_id",
ADD COLUMN     "userDefined" JSONB;

-- AlterTable
ALTER TABLE "Sample" DROP COLUMN "ammonium",
DROP COLUMN "ctd_bottle_number",
DROP COLUMN "ctd_cast_number",
DROP COLUMN "extract_id",
DROP COLUMN "line_id",
DROP COLUMN "materialSampleID",
DROP COLUMN "phaeopigments",
DROP COLUMN "phosphate",
DROP COLUMN "replicate_number",
DROP COLUMN "serial_number",
DROP COLUMN "silicate",
DROP COLUMN "station_id",
ADD COLUMN     "userDefined" JSONB;

-- DropTable
DROP TABLE "Change";

-- AddForeignKey
ALTER TABLE "Edit" ADD CONSTRAINT "Edit_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edit" ADD CONSTRAINT "Edit_analysis_run_name_fkey" FOREIGN KEY ("analysis_run_name") REFERENCES "Analysis"("analysis_run_name") ON DELETE CASCADE ON UPDATE CASCADE;
