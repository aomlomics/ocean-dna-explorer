-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "dateSubmitted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "attributionTitle" TEXT,
    "description" TEXT,
    "location" TEXT,
    "dateTaken" TIMESTAMP(3),

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attribution" (
    "id" SERIAL NOT NULL,
    "attributionTitle" TEXT NOT NULL,
    "attributionNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attributionUrl" TEXT,
    "attributionInstitute" TEXT,

    CONSTRAINT "Attribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Image_name_key" ON "Image"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Image_url_key" ON "Image"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Attribution_attributionTitle_key" ON "Attribution"("attributionTitle");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_attributionTitle_fkey" FOREIGN KEY ("attributionTitle") REFERENCES "Attribution"("attributionTitle") ON DELETE SET NULL ON UPDATE CASCADE;
