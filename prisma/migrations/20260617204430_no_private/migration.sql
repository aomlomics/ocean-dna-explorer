/*
  Warnings:

  - You are about to drop the column `isPrivate` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `isPrivate` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Analysis" DROP COLUMN "isPrivate";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "isPrivate";
