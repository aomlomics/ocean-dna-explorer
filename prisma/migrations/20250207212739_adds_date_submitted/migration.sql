/*
  Warnings:

  - You are about to drop the column `consensusTaxonomyId` on the `Feature` table. All the data in the column will be lost.
  - Added the required column `dateSubmitted` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sequenceLength` to the `Feature` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateSubmitted` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Feature" DROP CONSTRAINT "Feature_consensusTaxonomyId_fkey";

-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "dateSubmitted" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Feature" DROP COLUMN "consensusTaxonomyId",
ADD COLUMN     "sequenceLength" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "dateSubmitted" TIMESTAMP(3) NOT NULL;
