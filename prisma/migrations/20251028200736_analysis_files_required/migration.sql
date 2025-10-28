/*
  Warnings:

  - Made the column `asvFileChecksum_ODE` on table `Analysis` required. This step will fail if there are existing NULL values in that column.
  - Made the column `asvFileUrl_ODE` on table `Analysis` required. This step will fail if there are existing NULL values in that column.
  - Made the column `occurrenceFileChecksum_ODE` on table `Analysis` required. This step will fail if there are existing NULL values in that column.
  - Made the column `occurrenceFileUrl_ODE` on table `Analysis` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Analysis" ALTER COLUMN "asvFileChecksum_ODE" SET NOT NULL,
ALTER COLUMN "asvFileUrl_ODE" SET NOT NULL,
ALTER COLUMN "occurrenceFileChecksum_ODE" SET NOT NULL,
ALTER COLUMN "occurrenceFileUrl_ODE" SET NOT NULL;
