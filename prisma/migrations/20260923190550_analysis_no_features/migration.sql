/*
  Warnings:

  - You are about to drop the `_AnalysisToFeature` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_AnalysisToFeature" DROP CONSTRAINT "_AnalysisToFeature_A_fkey";

-- DropForeignKey
ALTER TABLE "_AnalysisToFeature" DROP CONSTRAINT "_AnalysisToFeature_B_fkey";

-- DropTable
DROP TABLE "_AnalysisToFeature";
