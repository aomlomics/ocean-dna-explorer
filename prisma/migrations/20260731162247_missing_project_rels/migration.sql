-- AlterTable
ALTER TABLE "AlphaDiversityIndex" ALTER COLUMN "project_id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Occurrence" ALTER COLUMN "project_id" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "AlphaDiversityIndex_project_id_lib_id_idx" ON "AlphaDiversityIndex"("project_id", "lib_id");

-- CreateIndex
CREATE INDEX "Library_project_id_samp_name_idx" ON "Library"("project_id", "samp_name");

-- CreateIndex
CREATE INDEX "Occurrence_project_id_lib_id_idx" ON "Occurrence"("project_id", "lib_id");

-- AddForeignKey
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlphaDiversityIndex" ADD CONSTRAINT "AlphaDiversityIndex_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;
