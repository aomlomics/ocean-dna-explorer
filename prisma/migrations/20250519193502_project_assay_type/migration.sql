/*
  Warnings:

  - Added the required column `assay_type` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "assay_type" TEXT NOT NULL;
