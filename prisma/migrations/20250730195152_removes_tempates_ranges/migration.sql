-- CUSTOM MIGRATION

-- Analysis
ALTER TABLE "Analysis"
DROP COLUMN "percent_match",
DROP COLUMN "percent_query_cover";
ALTER TABLE "Analysis" RENAME COLUMN "percent_match__TEMP" TO "percent_match";
ALTER TABLE "Analysis" RENAME COLUMN "percent_query_cover__TEMP" TO "percent_query_cover";

-- Assay
ALTER TABLE "Assay"
DROP COLUMN "ampliconSize";
ALTER TABLE "Assay" RENAME COLUMN "ampliconSize__TEMP" TO "ampliconSize";

-- Sample
ALTER TABLE "Sample"
DROP COLUMN "eventDate",
DROP COLUMN "date_ext";
ALTER TABLE "Sample" RENAME COLUMN "eventDate__TEMP" TO "eventDate";
ALTER TABLE "Sample" RENAME COLUMN "date_ext__TEMP" TO "date_ext";
