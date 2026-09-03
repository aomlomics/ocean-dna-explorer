-- CreateTable
CREATE TABLE "_AnalysisToLibrary" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AnalysisToLibrary_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AnalysisToFeature" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AnalysisToFeature_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AnalysisToTaxonomy" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AnalysisToTaxonomy_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SampleToTaxonomy" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SampleToTaxonomy_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AnalysisToLibrary_B_index" ON "_AnalysisToLibrary"("B");

-- CreateIndex
CREATE INDEX "_AnalysisToFeature_B_index" ON "_AnalysisToFeature"("B");

-- CreateIndex
CREATE INDEX "_AnalysisToTaxonomy_B_index" ON "_AnalysisToTaxonomy"("B");

-- CreateIndex
CREATE INDEX "_SampleToTaxonomy_B_index" ON "_SampleToTaxonomy"("B");

-- CreateIndex
CREATE INDEX "Analysis_trusted_idx" ON "Analysis"("trusted");

-- AddForeignKey
ALTER TABLE "_AnalysisToLibrary" ADD CONSTRAINT "_AnalysisToLibrary_A_fkey" FOREIGN KEY ("A") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnalysisToLibrary" ADD CONSTRAINT "_AnalysisToLibrary_B_fkey" FOREIGN KEY ("B") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnalysisToFeature" ADD CONSTRAINT "_AnalysisToFeature_A_fkey" FOREIGN KEY ("A") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnalysisToFeature" ADD CONSTRAINT "_AnalysisToFeature_B_fkey" FOREIGN KEY ("B") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnalysisToTaxonomy" ADD CONSTRAINT "_AnalysisToTaxonomy_A_fkey" FOREIGN KEY ("A") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnalysisToTaxonomy" ADD CONSTRAINT "_AnalysisToTaxonomy_B_fkey" FOREIGN KEY ("B") REFERENCES "Taxonomy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SampleToTaxonomy" ADD CONSTRAINT "_SampleToTaxonomy_A_fkey" FOREIGN KEY ("A") REFERENCES "Sample"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SampleToTaxonomy" ADD CONSTRAINT "_SampleToTaxonomy_B_fkey" FOREIGN KEY ("B") REFERENCES "Taxonomy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill _AnalysisToLibrary
INSERT INTO "_AnalysisToLibrary" ("A", "B")
SELECT DISTINCT
    a."id",
    l."id"
FROM "Analysis" a
JOIN "Occurrence" o
    ON o."project_id" = a."project_id"
    AND o."analysis_run_name" = a."analysis_run_name"
JOIN "Library" l
    ON l."project_id" = o."project_id"
    AND l."lib_id" = o."lib_id"
ON CONFLICT DO NOTHING;

-- Backfill _AnalysisToFeature
INSERT INTO "_AnalysisToFeature" ("A", "B")
SELECT DISTINCT
    a."id",
    f."id"
FROM "Analysis" a
JOIN "Occurrence" o
    ON o."project_id" = a."project_id"
    AND o."analysis_run_name" = a."analysis_run_name"
JOIN "Feature" f
    ON f."featureid" = o."featureid"
ON CONFLICT DO NOTHING;

-- Backfill _AnalysisToTaxonomy
INSERT INTO "_AnalysisToTaxonomy" ("A", "B")
SELECT DISTINCT
    a."id",
    t."id"
FROM "Analysis" a
JOIN "Assignment" ass
    ON ass."project_id" = a."project_id"
    AND ass."analysis_run_name" = a."analysis_run_name"
JOIN "Taxonomy" t
    ON t."taxonomy" = ass."taxonomy"
ON CONFLICT DO NOTHING;

-- Backfill _SampleToTaxonomy
INSERT INTO "_SampleToTaxonomy" ("A", "B")
SELECT DISTINCT
    s."id",
    t."id"
FROM "Occurrence" o
JOIN "Library" l
    ON l."project_id" = o."project_id"
    AND l."lib_id" = o."lib_id"
JOIN "Sample" s
    ON s."project_id" = l."project_id"
    AND s."samp_name" = l."samp_name"
JOIN "Assignment" ass
    ON ass."project_id" = o."project_id"
    AND ass."analysis_run_name" = o."analysis_run_name"
    AND ass."featureid" = o."featureid"
JOIN "Taxonomy" t
    ON t."taxonomy" = ass."taxonomy"
ON CONFLICT DO NOTHING;
