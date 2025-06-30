/*
  Warnings:

  - You are about to drop the column `userIds` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `isPrivate` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `userIds` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `isPrivate` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `userIds` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `isPrivate` on the `Feature` table. All the data in the column will be lost.
  - You are about to drop the column `userIds` on the `Feature` table. All the data in the column will be lost.
  - You are about to drop the column `isPrivate` on the `Library` table. All the data in the column will be lost.
  - You are about to drop the column `userIds` on the `Library` table. All the data in the column will be lost.
  - You are about to drop the column `isPrivate` on the `Occurrence` table. All the data in the column will be lost.
  - You are about to drop the column `userIds` on the `Occurrence` table. All the data in the column will be lost.
  - You are about to drop the column `isPrivate` on the `Primer` table. All the data in the column will be lost.
  - You are about to drop the column `userIds` on the `Primer` table. All the data in the column will be lost.
  - You are about to drop the column `isPrivate` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `userIds` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `isPrivate` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `userIds` on the `Taxonomy` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Analysis" DROP COLUMN "userIds";

-- AlterTable
ALTER TABLE "Assay" DROP COLUMN "isPrivate",
DROP COLUMN "userIds";

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "isPrivate",
DROP COLUMN "userIds";

-- AlterTable
ALTER TABLE "Feature" DROP COLUMN "isPrivate",
DROP COLUMN "userIds";

-- AlterTable
ALTER TABLE "Library" DROP COLUMN "isPrivate",
DROP COLUMN "userIds";

-- AlterTable
ALTER TABLE "Occurrence" DROP COLUMN "isPrivate",
DROP COLUMN "userIds";

-- AlterTable
ALTER TABLE "Primer" DROP COLUMN "isPrivate",
DROP COLUMN "userIds";

-- AlterTable
ALTER TABLE "Sample" DROP COLUMN "isPrivate",
DROP COLUMN "userIds";

-- AlterTable
ALTER TABLE "Taxonomy" DROP COLUMN "isPrivate",
DROP COLUMN "userIds";
