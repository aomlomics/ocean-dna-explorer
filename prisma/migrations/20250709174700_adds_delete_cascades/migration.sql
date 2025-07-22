-- DropForeignKey
ALTER TABLE "Analysis" DROP CONSTRAINT "Analysis_assay_name_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_featureid_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_taxonomy_fkey";

-- DropForeignKey
ALTER TABLE "Library" DROP CONSTRAINT "Library_assay_name_fkey";

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_assay_name_fkey" FOREIGN KEY ("assay_name") REFERENCES "Assay"("assay_name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_featureid_fkey" FOREIGN KEY ("featureid") REFERENCES "Feature"("featureid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_taxonomy_fkey" FOREIGN KEY ("taxonomy") REFERENCES "Taxonomy"("taxonomy") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Library" ADD CONSTRAINT "Library_assay_name_fkey" FOREIGN KEY ("assay_name") REFERENCES "Assay"("assay_name") ON DELETE CASCADE ON UPDATE CASCADE;
