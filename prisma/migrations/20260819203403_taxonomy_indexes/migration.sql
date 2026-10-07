/*
  Warnings:

  - Made the column `project_id` on table `Assignment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "BlastQuery" DROP CONSTRAINT "BlastQuery_database_fkey";

-- AlterTable
ALTER TABLE "Assignment" ALTER COLUMN "project_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Taxonomy_kingdom_idx" ON "Taxonomy"("kingdom");

-- CreateIndex
CREATE INDEX "Taxonomy_family_idx" ON "Taxonomy"("family");

-- CreateIndex
CREATE INDEX "Taxonomy_genus_idx" ON "Taxonomy"("genus");

-- CreateIndex
CREATE INDEX "Taxonomy_species_idx" ON "Taxonomy"("species");

-- AddForeignKey
ALTER TABLE "BlastQuery" ADD CONSTRAINT "BlastQuery_database_fkey" FOREIGN KEY ("database") REFERENCES "Assay"("assay_name") ON DELETE RESTRICT ON UPDATE CASCADE;
