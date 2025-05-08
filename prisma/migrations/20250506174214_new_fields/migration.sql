/*
  Warnings:

  - You are about to drop the column `deblur_sample_stats` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `seq_samp_id` on the `Library` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "tourmaline_classify_method" AS ENUM ('consensus-blast', 'naive-bayes', 'consensus-vsearch', 'bt2-blca');

-- AlterTable
ALTER TABLE "Analysis" DROP COLUMN "deblur_sample_stats",
ADD COLUMN     "blca_confidence" DOUBLE PRECISION,
ADD COLUMN     "tourmaline_classify_method" TEXT;

-- AlterTable
ALTER TABLE "Library" DROP COLUMN "seq_samp_id";
