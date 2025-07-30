-- AlterTable
ALTER TABLE "Analysis" RENAME COLUMN "percent_match__TEMP" TO "percent_match",
RENAME COLUMN "percent_query_cover__TEMP" TO "percent_query_cover";

-- AlterTable
ALTER TABLE "Assay" RENAME COLUMN "ampliconSize__TEMP" TO "ampliconSize";

-- AlterTable
ALTER TABLE "Sample" RENAME COLUMN "eventDate__TEMP" TO "eventDate",
RENAME COLUMN "date_ext_TEMP" TO "date_ext";
