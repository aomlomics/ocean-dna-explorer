/*
  Warnings:

  - Made the column `targetTaxonomicAssay` on table `Assay` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "percent_match" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
ADD COLUMN     "percent_query_cover" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[];

-- AlterTable
ALTER TABLE "Assay" ALTER COLUMN "targetTaxonomicAssay" SET NOT NULL;

-- CUSTOM
ALTER TABLE "Assay" ALTER COLUMN "ampliconSize" TYPE DOUBLE PRECISION[] USING ARRAY["Assay.ampliconSize"]::DOUBLE PRECISION[],
ALTER COLUMN "ampliconSize" SET DEFAULT ARRAY[]::DOUBLE PRECISION[];