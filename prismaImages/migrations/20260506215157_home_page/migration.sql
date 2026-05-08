/*
  Warnings:

  - Added the required column `homePage` to the `Image` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "homePage" BOOLEAN NOT NULL;
