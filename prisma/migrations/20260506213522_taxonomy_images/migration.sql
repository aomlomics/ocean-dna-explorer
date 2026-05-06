-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "consensus" DOUBLE PRECISION,
ADD COLUMN     "percent_id" DOUBLE PRECISION,
ALTER COLUMN "Confidence" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Taxonomy" ADD COLUMN     "imageFileUrl_ODE" TEXT;
