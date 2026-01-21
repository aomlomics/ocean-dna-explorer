/*
  Warnings:

  - You are about to drop the column `samp_name` on the `Occurrence` table. All the data in the column will be lost.
  - You are about to drop the column `bioproject_accession` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `expedition_id` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `ship_crs_expocode` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `woce_sect` on the `Project` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[analysis_run_name,lib_id,featureid]` on the table `Occurrence` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lib_id` to the `Occurrence` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expedition_id` to the `Sample` table without a default value. This is not possible if the table is not empty.
  - Added the required column `short_name` to the `Sample` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Occurrence" DROP CONSTRAINT "Occurrence_samp_name_fkey";

-- DropIndex
DROP INDEX "Occurrence_analysis_run_name_samp_name_featureid_key";

-- AlterTable
ALTER TABLE "Occurrence" DROP COLUMN "samp_name",
ADD COLUMN     "lib_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "bioproject_accession",
DROP COLUMN "expedition_id",
DROP COLUMN "ship_crs_expocode",
DROP COLUMN "woce_sect",
ADD COLUMN     "dataDescription" TEXT,
ADD COLUMN     "projectDescription" TEXT;

-- AlterTable
ALTER TABLE "Sample" ADD COLUMN     "bioproject_accession" TEXT,
ADD COLUMN     "expedition_id" TEXT NOT NULL,
ADD COLUMN     "ship_crs_expocode" TEXT,
ADD COLUMN     "short_name" TEXT NOT NULL,
ADD COLUMN     "woce_sect" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Occurrence_analysis_run_name_lib_id_featureid_key" ON "Occurrence"("analysis_run_name", "lib_id", "featureid");

-- AddForeignKey
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_lib_id_fkey" FOREIGN KEY ("lib_id") REFERENCES "Library"("lib_id") ON DELETE CASCADE ON UPDATE CASCADE;
