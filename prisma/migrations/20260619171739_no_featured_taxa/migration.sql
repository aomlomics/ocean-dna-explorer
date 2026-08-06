/*
  Warnings:

  - You are about to drop the column `commonName_ODE` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `imageFileUrl_ODE` on the `Taxonomy` table. All the data in the column will be lost.
  - You are about to drop the column `organismDescription_ODE` on the `Taxonomy` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Taxonomy" DROP COLUMN "commonName_ODE",
DROP COLUMN "imageFileUrl_ODE",
DROP COLUMN "organismDescription_ODE";
