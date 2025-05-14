/*
  Warnings:

  - You are about to drop the column `userId` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Analysis" DROP COLUMN "userId",
ADD COLUMN     "userIds" TEXT[];

-- AlterTable
ALTER TABLE "Assay" ADD COLUMN     "userIds" TEXT[];

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "userIds" TEXT[];

-- AlterTable
ALTER TABLE "Feature" ADD COLUMN     "userIds" TEXT[];

-- AlterTable
ALTER TABLE "Library" ADD COLUMN     "userIds" TEXT[];

-- AlterTable
ALTER TABLE "Occurrence" ADD COLUMN     "userIds" TEXT[];

-- AlterTable
ALTER TABLE "Primer" ADD COLUMN     "userIds" TEXT[];

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "userId",
ADD COLUMN     "userIds" TEXT[];

-- AlterTable
ALTER TABLE "Sample" ADD COLUMN     "userIds" TEXT[];

-- AlterTable
ALTER TABLE "Taxonomy" ADD COLUMN     "userIds" TEXT[];
