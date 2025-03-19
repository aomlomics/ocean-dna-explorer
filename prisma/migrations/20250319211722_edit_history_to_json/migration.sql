/*
  Warnings:

  - You are about to drop the `Edit` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Edit" DROP CONSTRAINT "Edit_analysis_run_name_fkey";

-- DropForeignKey
ALTER TABLE "Edit" DROP CONSTRAINT "Edit_project_id_fkey";

-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "editHistory" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "editHistory" JSONB NOT NULL DEFAULT '[]';

-- DropTable
DROP TABLE "Edit";
