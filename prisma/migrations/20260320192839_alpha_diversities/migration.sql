-- CreateTable
CREATE TABLE "AlphaDiversity" (
    "id" SERIAL NOT NULL,
    "dateCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysis_run_name" TEXT NOT NULL,
    "indexType" TEXT NOT NULL,
    "rarefied" BOOLEAN NOT NULL,
    "depth" INTEGER,

    CONSTRAINT "AlphaDiversity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlphaDiversityIndex" (
    "id" SERIAL NOT NULL,
    "lib_id" TEXT NOT NULL,
    "parentId" INTEGER NOT NULL,
    "index" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AlphaDiversityIndex_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AlphaDiversity" ADD CONSTRAINT "AlphaDiversity_analysis_run_name_fkey" FOREIGN KEY ("analysis_run_name") REFERENCES "Analysis"("analysis_run_name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlphaDiversityIndex" ADD CONSTRAINT "AlphaDiversityIndex_lib_id_fkey" FOREIGN KEY ("lib_id") REFERENCES "Library"("lib_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlphaDiversityIndex" ADD CONSTRAINT "AlphaDiversityIndex_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AlphaDiversity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
