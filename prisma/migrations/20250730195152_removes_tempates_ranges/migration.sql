/*
  Warnings:

  - You are about to drop the column `percent_match__TEMP` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `percent_query_cover__TEMP` on the `Analysis` table. All the data in the column will be lost.
  - The `percent_match` column on the `Analysis` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `percent_query_cover` column on the `Analysis` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `ampliconSize__TEMP` on the `Assay` table. All the data in the column will be lost.
  - The `ampliconSize` column on the `Assay` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `date_ext__TEMP` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `eventDate__TEMP` on the `Sample` table. All the data in the column will be lost.
  - The `date_ext` column on the `Sample` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `eventDate` to the `Sample` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Analysis" DROP COLUMN "percent_match__TEMP",
DROP COLUMN "percent_query_cover__TEMP",
DROP COLUMN "percent_match",
ADD COLUMN     "percent_match" DOUBLE PRECISION,
DROP COLUMN "percent_query_cover",
ADD COLUMN     "percent_query_cover" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Assay" DROP COLUMN "ampliconSize__TEMP",
DROP COLUMN "ampliconSize",
ADD COLUMN     "ampliconSize" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Sample" DROP COLUMN "date_ext__TEMP",
DROP COLUMN "eventDate__TEMP",
DROP COLUMN "eventDate",
ADD COLUMN     "eventDate" TIMESTAMP(3) NOT NULL,
DROP COLUMN "date_ext",
ADD COLUMN     "date_ext" TIMESTAMP(3);
