/*
  Warnings:

  - A unique constraint covering the columns `[project_id,analysis_run_name]` on the table `Analysis` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[project_id,analysis_run_name,featureid]` on the table `Assignment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[project_id,analysis_run_name,lib_id,featureid]` on the table `Occurrence` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `project_id` to the `AlphaDiversity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `project_id` to the `Assignment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AlphaDiversity" DROP CONSTRAINT "AlphaDiversity_analysis_run_name_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_analysis_run_name_fkey";

-- DropForeignKey
ALTER TABLE "Occurrence" DROP CONSTRAINT "Occurrence_analysis_run_name_featureid_fkey";

-- DropForeignKey
ALTER TABLE "Occurrence" DROP CONSTRAINT "Occurrence_analysis_run_name_fkey";

-- DropIndex
DROP INDEX "Analysis_analysis_run_name_key";

-- DropIndex
DROP INDEX "Assignment_analysis_run_name_featureid_key";

-- DropIndex
DROP INDEX "Occurrence_analysis_run_name_lib_id_featureid_key";

-- Manually backfill project_id from analysis
ALTER TABLE "AlphaDiversity" ADD COLUMN "project_id" TEXT;

UPDATE "AlphaDiversity" div
SET "project_id" = a.project_id
FROM "Analysis" a WHERE div.analysis_run_name = a.analysis_run_name;

ALTER TABLE "AlphaDiversity" ALTER COLUMN "project_id" SET NOT NULL;

-- Manually backfill project_id from analysis
ALTER TABLE "Assignment" ADD COLUMN "project_id" TEXT;

UPDATE "Assignment" assign
SET "project_id" = a.project_id
FROM "Analysis" a WHERE assign.analysis_run_name = a.analysis_run_name;

ALTER TABLE "AlphaDiversity" ALTER COLUMN "project_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "AlphaDiversity_project_id_analysis_run_name_idx" ON "AlphaDiversity"("project_id", "analysis_run_name");

-- CreateIndex
CREATE UNIQUE INDEX "Analysis_project_id_analysis_run_name_key" ON "Analysis"("project_id", "analysis_run_name");

-- CreateIndex
CREATE INDEX "Assignment_project_id_analysis_run_name_idx" ON "Assignment"("project_id", "analysis_run_name");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_project_id_analysis_run_name_featureid_key" ON "Assignment"("project_id", "analysis_run_name", "featureid");

-- CreateIndex
CREATE INDEX "Occurrence_project_id_analysis_run_name_idx" ON "Occurrence"("project_id", "analysis_run_name");

-- CreateIndex
CREATE UNIQUE INDEX "Occurrence_project_id_analysis_run_name_lib_id_featureid_key" ON "Occurrence"("project_id", "analysis_run_name", "lib_id", "featureid");

-- AddForeignKey
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_project_id_analysis_run_name_fkey" FOREIGN KEY ("project_id", "analysis_run_name") REFERENCES "Analysis"("project_id", "analysis_run_name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_project_id_analysis_run_name_featureid_fkey" FOREIGN KEY ("project_id", "analysis_run_name", "featureid") REFERENCES "Assignment"("project_id", "analysis_run_name", "featureid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_project_id_analysis_run_name_fkey" FOREIGN KEY ("project_id", "analysis_run_name") REFERENCES "Analysis"("project_id", "analysis_run_name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlphaDiversity" ADD CONSTRAINT "AlphaDiversity_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlphaDiversity" ADD CONSTRAINT "AlphaDiversity_project_id_analysis_run_name_fkey" FOREIGN KEY ("project_id", "analysis_run_name") REFERENCES "Analysis"("project_id", "analysis_run_name") ON DELETE CASCADE ON UPDATE CASCADE;
