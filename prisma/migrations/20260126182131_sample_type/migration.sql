/*
  Warnings:

  - A unique constraint covering the columns `[biosample_accession]` on the table `Sample` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "sample_type" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Sample_biosample_accession_key" ON "Sample"("biosample_accession");
