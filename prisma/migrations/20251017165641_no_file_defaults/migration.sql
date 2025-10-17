-- AlterTable
ALTER TABLE "Analysis" ALTER COLUMN "analysisMetadataFileChecksum_ODE" DROP DEFAULT,
ALTER COLUMN "analysisMetadataFileUrl_ODE" DROP DEFAULT,
ALTER COLUMN "asvFileChecksum_ODE" DROP DEFAULT,
ALTER COLUMN "asvFileUrl_ODE" DROP DEFAULT,
ALTER COLUMN "occurrenceFileChecksum_ODE" DROP DEFAULT,
ALTER COLUMN "occurrenceFileUrl_ODE" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "libraryMetadataFileChecksum_ODE" DROP DEFAULT,
ALTER COLUMN "libraryMetadataFileUrl_ODE" DROP DEFAULT,
ALTER COLUMN "projectMetadataFileChecksum_ODE" DROP DEFAULT,
ALTER COLUMN "projectMetadataFileUrl_ODE" DROP DEFAULT,
ALTER COLUMN "sampleMetadataFileChecksum_ODE" DROP DEFAULT,
ALTER COLUMN "sampleMetadataFileUrl_ODE" DROP DEFAULT;
