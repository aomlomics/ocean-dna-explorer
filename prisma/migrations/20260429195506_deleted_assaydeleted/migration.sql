/*
  Warnings:

  - You are about to drop the column `deleted_ODE` on the `Assay` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Assay" DROP COLUMN "deleted_ODE";

-- AlterTable
ALTER TABLE "Taxonomy" ADD COLUMN     "division" TEXT,
ADD COLUMN     "domain" TEXT,
ADD COLUMN     "supergroup" TEXT;
