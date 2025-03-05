-- AlterTable
ALTER TABLE "Analysis" ALTER COLUMN "dateSubmitted" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "dateSubmitted" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Edit" (
    "id" SERIAL NOT NULL,
    "dateEdited" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "project_id" TEXT,
    "analysis_run_name" TEXT,

    CONSTRAINT "Edit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Change" (
    "id" SERIAL NOT NULL,
    "editId" INTEGER NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT NOT NULL,
    "newValue" TEXT NOT NULL,

    CONSTRAINT "Change_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Edit" ADD CONSTRAINT "Edit_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edit" ADD CONSTRAINT "Edit_analysis_run_name_fkey" FOREIGN KEY ("analysis_run_name") REFERENCES "Analysis"("analysis_run_name") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Change" ADD CONSTRAINT "Change_editId_fkey" FOREIGN KEY ("editId") REFERENCES "Edit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
