/*
  Warnings:

  - You are about to drop the column `query` on the `BlastQuery` table. All the data in the column will be lost.
  - You are about to drop the column `sequence` on the `BlastQuery` table. All the data in the column will be lost.
  - Added the required column `databaseVersion` to the `BlastQuery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `evalue` to the `BlastQuery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `max_target_seqs` to the `BlastQuery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `perc_identity` to the `BlastQuery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qcov_hsp_perc` to the `BlastQuery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task` to the `BlastQuery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sequence` to the `BlastQueryResult` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "BlastQuery_dateCalculated_sequence_key";

-- AlterTable
ALTER TABLE "BlastQuery" DROP COLUMN "query",
DROP COLUMN "sequence",
ADD COLUMN     "databaseVersion" INTEGER NOT NULL,
ADD COLUMN     "evalue" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "max_target_seqs" INTEGER NOT NULL,
ADD COLUMN     "perc_identity" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "qcov_hsp_perc" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "sequences" TEXT[],
ADD COLUMN     "task" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "BlastQueryResult" ADD COLUMN     "query" TEXT,
ADD COLUMN     "sequence" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "BlastQuery_sequences_idx" ON "BlastQuery" USING GIN ("sequences");

-- CreateIndex
CREATE INDEX "BlastQueryResult_queryId_sequence_idx" ON "BlastQueryResult"("queryId", "sequence");
