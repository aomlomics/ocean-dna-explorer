-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "analysisMetadataFileChecksum_ODE" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "analysisMetadataFileUrl_ODE" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "asvFileChecksum_ODE" TEXT DEFAULT '',
ADD COLUMN     "asvFileUrl_ODE" TEXT DEFAULT '',
ADD COLUMN     "occurrenceFileChecksum_ODE" TEXT DEFAULT '',
ADD COLUMN     "occurrenceFileUrl_ODE" TEXT DEFAULT '';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "libraryMetadataFileChecksum_ODE" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "libraryMetadataFileUrl_ODE" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "projectMetadataFileChecksum_ODE" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "projectMetadataFileUrl_ODE" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sampleMetadataFileChecksum_ODE" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sampleMetadataFileUrl_ODE" TEXT NOT NULL DEFAULT '';
