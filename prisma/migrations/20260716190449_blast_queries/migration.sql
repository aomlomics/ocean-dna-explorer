-- CreateTable
CREATE TABLE "BlastQuery" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "dateCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sequence" TEXT NOT NULL,
    "query" TEXT,
    "database" TEXT,

    CONSTRAINT "BlastQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlastQueryResult" (
    "id" SERIAL NOT NULL,
    "featureid" TEXT NOT NULL,
    "queryId" INTEGER NOT NULL,
    "percentIdentity" DOUBLE PRECISION NOT NULL,
    "alignmentLength" INTEGER NOT NULL,
    "mismatches" INTEGER NOT NULL,
    "gapOpens" INTEGER NOT NULL,
    "queryStart" INTEGER NOT NULL,
    "queryEnd" INTEGER NOT NULL,
    "subjectStart" INTEGER NOT NULL,
    "subjectEnd" INTEGER NOT NULL,
    "eValue" DOUBLE PRECISION NOT NULL,
    "bitScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BlastQueryResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BlastQuery" ADD CONSTRAINT "BlastQuery_database_fkey" FOREIGN KEY ("database") REFERENCES "Assay"("assay_name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlastQueryResult" ADD CONSTRAINT "BlastQueryResult_featureid_fkey" FOREIGN KEY ("featureid") REFERENCES "Feature"("featureid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlastQueryResult" ADD CONSTRAINT "BlastQueryResult_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "BlastQuery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
