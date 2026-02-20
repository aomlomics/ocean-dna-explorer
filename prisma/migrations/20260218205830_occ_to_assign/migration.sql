/*
  Warnings:

  - You are about to drop the `_LibraryToTaxonomy` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_LibraryToTaxonomy" DROP CONSTRAINT "_LibraryToTaxonomy_A_fkey";

-- DropForeignKey
ALTER TABLE "_LibraryToTaxonomy" DROP CONSTRAINT "_LibraryToTaxonomy_B_fkey";

-- DropTable
DROP TABLE "_LibraryToTaxonomy";

-- AddForeignKey
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_analysis_run_name_featureid_fkey" FOREIGN KEY ("analysis_run_name", "featureid") REFERENCES "Assignment"("analysis_run_name", "featureid") ON DELETE RESTRICT ON UPDATE CASCADE;
