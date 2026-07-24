/*
  Warnings:

  - A unique constraint covering the columns `[dateCalculated,sequence]` on the table `BlastQuery` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BlastQuery_dateCalculated_sequence_key" ON "BlastQuery"("dateCalculated", "sequence");
