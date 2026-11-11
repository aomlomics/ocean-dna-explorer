/*
  Warnings:

  - You are about to drop the column `biovar` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `clade` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `class` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `division` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `domain` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `family` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `forma` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `genus` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `group` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `higherClassification` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `infrakingdom` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `kingdom` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `lineage` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `pathovar` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `phylum` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `realm` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `section` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `serovar` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `species` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `strain` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `subclass` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `subdivision` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `subfamily` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `subgenus` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `subkingdom` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `suborder` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `subphylum` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `subrealm` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `subsection` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `subspecies` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `supergroup` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `superkingdom` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `varietas` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `verbatimIdentification` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the `_AnalysisToTaxonomy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SampleToTaxonomy` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateTable
CREATE TABLE "TaxonomicHierarchy" (
    "id" SERIAL NOT NULL,
    "project_id" TEXT NOT NULL,
    "analysis_run_name" TEXT NOT NULL,
    "taxonomy" TEXT NOT NULL,
    "verbatimIdentification" TEXT NOT NULL,
    "higherClassification" TEXT,
    "realm" TEXT,
    "subrealm" TEXT,
    "domain" TEXT,
    "superkingdom" TEXT,
    "supergroup" TEXT,
    "kingdom" TEXT,
    "infrakingdom" TEXT,
    "subkingdom" TEXT,
    "phylum" TEXT,
    "division" TEXT,
    "subphylum" TEXT,
    "subdivision" TEXT,
    "class" TEXT,
    "subclass" TEXT,
    "section" TEXT,
    "subsection" TEXT,
    "order" TEXT,
    "suborder" TEXT,
    "family" TEXT,
    "subfamily" TEXT,
    "genus" TEXT,
    "subgenus" TEXT,
    "species" TEXT,
    "subspecies" TEXT,
    "varietas" TEXT,
    "forma" TEXT,
    "biovar" TEXT,
    "serovar" TEXT,
    "pathovar" TEXT,
    "strain" TEXT,
    "clade" TEXT,
    "lineage" TEXT,
    "group" TEXT,
    "type" TEXT,

    CONSTRAINT "TaxonomicHierarchy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomicHierarchy_project_id_analysis_run_name_taxonomy_key" ON "TaxonomicHierarchy"("project_id", "analysis_run_name", "taxonomy");

-- Backfill TaxonomicHierarchy
INSERT INTO "TaxonomicHierarchy" (
    "project_id",
    "analysis_run_name",
    "taxonomy",
    "verbatimIdentification",
    "higherClassification",
    "realm",
    "subrealm",
    "domain",
    "superkingdom",
    "supergroup",
    "kingdom",
    "infrakingdom",
    "subkingdom",
    "phylum",
    "division",
    "subphylum",
    "subdivision",
    "class",
    "subclass",
    "section",
    "subsection",
    "order",
    "suborder",
    "family",
    "subfamily",
    "genus",
    "subgenus",
    "species",
    "subspecies",
    "varietas",
    "forma",
    "biovar",
    "serovar",
    "pathovar",
    "strain",
    "clade",
    "lineage",
    "group",
    "type"
)
SELECT DISTINCT
    a."project_id",
    a."analysis_run_name",
    t."taxonomy",
    t."verbatimIdentification",
    t."higherClassification",
    t."realm",
    t."subrealm",
    t."domain",
    t."superkingdom",
    t."supergroup",
    t."kingdom",
    t."infrakingdom",
    t."subkingdom",
    t."phylum",
    t."division",
    t."subphylum",
    t."subdivision",
    t."class",
    t."subclass",
    t."section",
    t."subsection",
    t."order",
    t."suborder",
    t."family",
    t."subfamily",
    t."genus",
    t."subgenus",
    t."species",
    t."subspecies",
    t."varietas",
    t."forma",
    t."biovar",
    t."serovar",
    t."pathovar",
    t."strain",
    t."clade",
    t."lineage",
    t."group",
    t."type"
FROM "Assignment" a
JOIN "Taxonomy" t
    ON t."taxonomy" = a."taxonomy"
ON CONFLICT DO NOTHING;

-- CreateTable
CREATE TABLE "_SampleToTaxonomicHierarchy" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SampleToTaxonomicHierarchy_AB_pkey" PRIMARY KEY ("A","B")
);

-- Backfill _SampleToTaxonomicHierarchy
INSERT INTO "_SampleToTaxonomicHierarchy" ("A", "B")
SELECT DISTINCT
    s."id",
    th."id"
FROM "Occurrence" o
JOIN "Library" l
    ON l."project_id" = o."project_id"
    AND l."lib_id" = o."lib_id"
JOIN "Sample" s
    ON s."project_id" = l."project_id"
    AND s."samp_name" = l."samp_name"
JOIN "Assignment" a
    ON a."project_id" = o."project_id"
    AND a."analysis_run_name" = o."analysis_run_name"
    AND a."featureid" = o."featureid"
JOIN "TaxonomicHierarchy" th
    ON th."project_id" = a."project_id"
    AND th."analysis_run_name" = a."analysis_run_name"
    AND th."taxonomy" = a."taxonomy"
ON CONFLICT DO NOTHING;

-- DropForeignKey
ALTER TABLE "_AnalysisToTaxonomy" DROP CONSTRAINT "_AnalysisToTaxonomy_A_fkey";

-- DropForeignKey
ALTER TABLE "_AnalysisToTaxonomy" DROP CONSTRAINT "_AnalysisToTaxonomy_B_fkey";

-- DropForeignKey
ALTER TABLE "_SampleToTaxonomy" DROP CONSTRAINT "_SampleToTaxonomy_A_fkey";

-- DropForeignKey
ALTER TABLE "_SampleToTaxonomy" DROP CONSTRAINT "_SampleToTaxonomy_B_fkey";

-- DropIndex
DROP INDEX "Taxonomy_family_idx";

-- DropIndex
DROP INDEX "Taxonomy_genus_idx";

-- DropIndex
DROP INDEX "Taxonomy_kingdom_idx";

-- DropIndex
DROP INDEX "Taxonomy_species_idx";

-- AlterTable
ALTER TABLE "Taxonomy" DROP COLUMN "biovar",
DROP COLUMN "clade",
DROP COLUMN "class",
DROP COLUMN "division",
DROP COLUMN "domain",
DROP COLUMN "family",
DROP COLUMN "forma",
DROP COLUMN "genus",
DROP COLUMN "group",
DROP COLUMN "higherClassification",
DROP COLUMN "infrakingdom",
DROP COLUMN "kingdom",
DROP COLUMN "lineage",
DROP COLUMN "order",
DROP COLUMN "pathovar",
DROP COLUMN "phylum",
DROP COLUMN "realm",
DROP COLUMN "section",
DROP COLUMN "serovar",
DROP COLUMN "species",
DROP COLUMN "strain",
DROP COLUMN "subclass",
DROP COLUMN "subdivision",
DROP COLUMN "subfamily",
DROP COLUMN "subgenus",
DROP COLUMN "subkingdom",
DROP COLUMN "suborder",
DROP COLUMN "subphylum",
DROP COLUMN "subrealm",
DROP COLUMN "subsection",
DROP COLUMN "subspecies",
DROP COLUMN "supergroup",
DROP COLUMN "superkingdom",
DROP COLUMN "type",
DROP COLUMN "varietas",
DROP COLUMN "verbatimIdentification";

-- DropTable
DROP TABLE "_AnalysisToTaxonomy";

-- DropTable
DROP TABLE "_SampleToTaxonomy";

-- CreateIndex
CREATE INDEX "TaxonomicHierarchy_project_id_analysis_run_name_idx" ON "TaxonomicHierarchy"("project_id", "analysis_run_name");

-- CreateIndex
CREATE INDEX "TaxonomicHierarchy_kingdom_idx" ON "TaxonomicHierarchy"("kingdom");

-- CreateIndex
CREATE INDEX "TaxonomicHierarchy_family_idx" ON "TaxonomicHierarchy"("family");

-- CreateIndex
CREATE INDEX "TaxonomicHierarchy_genus_idx" ON "TaxonomicHierarchy"("genus");

-- CreateIndex
CREATE INDEX "TaxonomicHierarchy_species_idx" ON "TaxonomicHierarchy"("species");

-- CreateIndex
CREATE INDEX "_SampleToTaxonomicHierarchy_B_index" ON "_SampleToTaxonomicHierarchy"("B");

-- CreateIndex
CREATE INDEX "Assignment_project_id_analysis_run_name_taxonomy_idx" ON "Assignment"("project_id", "analysis_run_name", "taxonomy");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_project_id_analysis_run_name_taxonomy_fkey" FOREIGN KEY ("project_id", "analysis_run_name", "taxonomy") REFERENCES "TaxonomicHierarchy"("project_id", "analysis_run_name", "taxonomy") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxonomicHierarchy" ADD CONSTRAINT "TaxonomicHierarchy_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxonomicHierarchy" ADD CONSTRAINT "TaxonomicHierarchy_project_id_analysis_run_name_fkey" FOREIGN KEY ("project_id", "analysis_run_name") REFERENCES "Analysis"("project_id", "analysis_run_name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxonomicHierarchy" ADD CONSTRAINT "TaxonomicHierarchy_taxonomy_fkey" FOREIGN KEY ("taxonomy") REFERENCES "Taxonomy"("taxonomy") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SampleToTaxonomicHierarchy" ADD CONSTRAINT "_SampleToTaxonomicHierarchy_A_fkey" FOREIGN KEY ("A") REFERENCES "Sample"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SampleToTaxonomicHierarchy" ADD CONSTRAINT "_SampleToTaxonomicHierarchy_B_fkey" FOREIGN KEY ("B") REFERENCES "TaxonomicHierarchy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
