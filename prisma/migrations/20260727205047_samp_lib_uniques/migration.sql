/*
  Warnings:

  - A unique constraint covering the columns `[project_id,lib_id]` on the table `Library` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[project_id,samp_name]` on the table `Sample` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[project_id,biosample_accession]` on the table `Sample` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `project_id` to the `AlphaDiversityIndex` table without a default value. This is not possible if the table is not empty.
  - Added the required column `project_id` to the `Occurrence` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AlphaDiversityIndex" DROP CONSTRAINT "AlphaDiversityIndex_lib_id_fkey";

-- DropForeignKey
ALTER TABLE "Library" DROP CONSTRAINT "Library_samp_name_fkey";

-- DropForeignKey
ALTER TABLE "Occurrence" DROP CONSTRAINT "Occurrence_lib_id_fkey";

-- DropIndex
DROP INDEX "Library_lib_id_key";

-- DropIndex
DROP INDEX "Sample_biosample_accession_key";

-- DropIndex
DROP INDEX "Sample_samp_name_key";

-- Manually backfill project_id from analysis
ALTER TABLE "AlphaDiversityIndex" ADD COLUMN "project_id" TEXT DEFAULT gen_random_uuid()::text;

UPDATE "AlphaDiversityIndex" i
SET "project_id" = a.project_id
FROM "AlphaDiversity" d
JOIN "Analysis" a USING(analysis_run_name)
WHERE i."parentId" = d.id;

ALTER TABLE "AlphaDiversityIndex" ALTER COLUMN     "project_id" SET NOT NULL;

-- Manually backfill project_id from analysis
ALTER TABLE "Occurrence" ADD COLUMN "project_id" TEXT DEFAULT gen_random_uuid()::text;

UPDATE "Occurrence" o
SET "project_id" = a.project_id
FROM "Analysis" a
WHERE o.analysis_run_name = a.analysis_run_name;

ALTER TABLE "Occurrence" ALTER COLUMN     "project_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Library_project_id_lib_id_key" ON "Library"("project_id", "lib_id");

-- CreateIndex
CREATE UNIQUE INDEX "Sample_project_id_samp_name_key" ON "Sample"("project_id", "samp_name");

-- CreateIndex
CREATE UNIQUE INDEX "Sample_project_id_biosample_accession_key" ON "Sample"("project_id", "biosample_accession");

-- AddForeignKey
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_project_id_lib_id_fkey" FOREIGN KEY ("project_id", "lib_id") REFERENCES "Library"("project_id", "lib_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlphaDiversityIndex" ADD CONSTRAINT "AlphaDiversityIndex_project_id_lib_id_fkey" FOREIGN KEY ("project_id", "lib_id") REFERENCES "Library"("project_id", "lib_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Library" ADD CONSTRAINT "Library_project_id_samp_name_fkey" FOREIGN KEY ("project_id", "samp_name") REFERENCES "Sample"("project_id", "samp_name") ON DELETE CASCADE ON UPDATE CASCADE;
