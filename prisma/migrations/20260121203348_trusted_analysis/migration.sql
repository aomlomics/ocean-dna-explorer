/*
  Warnings:

  - You are about to drop the column `ampliconSize` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `ampliconSize_End_ODE` on the `Assay` table. All the data in the column will be lost.
  - You are about to drop the column `ampliconSize_Midpoint_ODE` on the `Assay` table. All the data in the column will be lost.
  - Added the required column `trusted` to the `Analysis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "trusted" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "Assay" DROP COLUMN "ampliconSize",
DROP COLUMN "ampliconSize_End_ODE",
DROP COLUMN "ampliconSize_Midpoint_ODE",
ADD COLUMN     "assay_name_alternate" TEXT,
ADD COLUMN     "assay_reference" TEXT,
ADD COLUMN     "target" TEXT;

-- AlterTable
ALTER TABLE "AssayPrep" ADD COLUMN     "ampliconSize" DOUBLE PRECISION,
ADD COLUMN     "ampliconSize_End_ODE" DOUBLE PRECISION,
ADD COLUMN     "ampliconSize_Midpoint_ODE" DOUBLE PRECISION;
