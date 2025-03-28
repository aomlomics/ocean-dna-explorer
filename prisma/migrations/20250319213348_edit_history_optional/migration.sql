-- AlterTable
ALTER TABLE "Analysis" ALTER COLUMN "editHistory" DROP NOT NULL,
ALTER COLUMN "editHistory" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "editHistory" DROP NOT NULL,
ALTER COLUMN "editHistory" DROP DEFAULT;
