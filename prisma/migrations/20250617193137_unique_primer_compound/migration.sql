/*
  Warnings:

  - A unique constraint covering the columns `[pcr_primer_name_forward,pcr_primer_name_reverse]` on the table `Primer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Primer_pcr_primer_name_forward_pcr_primer_name_reverse_key" ON "Primer"("pcr_primer_name_forward", "pcr_primer_name_reverse");
