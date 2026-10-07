-- CreateTable
CREATE TABLE "_FeatureToSample" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_FeatureToSample_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FeatureToSample_B_index" ON "_FeatureToSample"("B");

-- AddForeignKey
ALTER TABLE "_FeatureToSample" ADD CONSTRAINT "_FeatureToSample_A_fkey" FOREIGN KEY ("A") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FeatureToSample" ADD CONSTRAINT "_FeatureToSample_B_fkey" FOREIGN KEY ("B") REFERENCES "Sample"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing relationships
INSERT INTO "_FeatureToSample" ("A", "B")
SELECT DISTINCT
    f."id",
    s."id"
FROM "Occurrence" AS o
JOIN "Library" AS l
    ON l."project_id" = o."project_id"
    AND l."lib_id" = o."lib_id"
JOIN "Sample" AS s
    ON s."project_id" = l."project_id"
    AND s."samp_name" = l."samp_name"
JOIN "Feature" AS f
    ON f."featureid" = o."featureid"
ON CONFLICT DO NOTHING;