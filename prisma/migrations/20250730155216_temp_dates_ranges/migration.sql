-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "percent_match_End_ODE" DOUBLE PRECISION,
ADD COLUMN     "percent_match_Midpoint_ODE" DOUBLE PRECISION,
ADD COLUMN     "percent_match__TEMP" DOUBLE PRECISION,
ADD COLUMN     "percent_query_cover_End_ODE" DOUBLE PRECISION,
ADD COLUMN     "percent_query_cover_Midpoint_ODE" DOUBLE PRECISION,
ADD COLUMN     "percent_query_cover__TEMP" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Assay" ADD COLUMN     "ampliconSize_End_ODE" DOUBLE PRECISION,
ADD COLUMN     "ampliconSize_Midpoint_ODE" DOUBLE PRECISION,
ADD COLUMN     "ampliconSize__TEMP" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Sample" ADD COLUMN     "date_ext__TEMP" TIMESTAMP(3),
ADD COLUMN     "eventDate_End_ODE" TIMESTAMP(3),
ADD COLUMN     "eventDate_Midpoint_ODE" TIMESTAMP(3),
ADD COLUMN     "eventDate__TEMP" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "eventDate" DROP NOT NULL,
ALTER COLUMN "eventDurationValue" SET DATA TYPE TEXT;
