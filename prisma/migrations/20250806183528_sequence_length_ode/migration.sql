/*
  Warnings:

  - You are about to drop the column `sequenceLength` on the `Feature` table. All the data in the column will be lost.
  - Added the required column `sequenceLength_ODE` to the `Feature` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Feature" RENAME COLUMN "sequenceLength" TO "sequenceLength_ODE";

-- AlterTable
ALTER TABLE "Sample" ALTER COLUMN "eventDate" DROP DEFAULT;
