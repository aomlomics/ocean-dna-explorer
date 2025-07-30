-- AlterTable
ALTER TABLE "Analysis"
DROP COLUMN "percent_match",
RENAME COLUMN "percent_match__TEMP" TO "percent_match",
DROP COLUMN "percent_query_cover",
RENAME COLUMN "percent_query_cover__TEMP" TO "percent_query_cover";

-- AlterTable
ALTER TABLE "Assay"
DROP COLUMN "ampliconSize",
RENAME COLUMN "ampliconSize__TEMP" TO "ampliconSize";

-- AlterTable
ALTER TABLE "Sample"
DROP COLUMN "eventDate",
RENAME COLUMN "eventDate__TEMP" TO "eventDate",
DROP COLUMN "date_ext",
RENAME COLUMN "date_ext_TEMP" TO "date_ext";
