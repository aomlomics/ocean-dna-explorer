/*
  Warnings:

  - The `ampliconSize` column on the `Assay` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `targetTaxonomicAssay` on table `Assay` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "percent_match" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
ADD COLUMN     "percent_query_cover" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[];

-- AlterTable
ALTER TABLE "Assay" ALTER COLUMN "targetTaxonomicAssay" SET NOT NULL,
DROP COLUMN "ampliconSize",
ADD COLUMN     "ampliconSize" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[];
