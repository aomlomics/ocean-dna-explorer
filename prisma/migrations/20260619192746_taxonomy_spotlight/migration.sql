-- CreateTable
CREATE TABLE "TaxonomySpotlight" (
    "id" SERIAL NOT NULL,
    "imageFileUrl_ODE" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "taxonomy" TEXT NOT NULL,
    "commonName" TEXT,

    CONSTRAINT "TaxonomySpotlight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomySpotlight_project_id_imageFileUrl_ODE_key" ON "TaxonomySpotlight"("project_id", "imageFileUrl_ODE");

-- AddForeignKey
ALTER TABLE "TaxonomySpotlight" ADD CONSTRAINT "TaxonomySpotlight_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxonomySpotlight" ADD CONSTRAINT "TaxonomySpotlight_taxonomy_fkey" FOREIGN KEY ("taxonomy") REFERENCES "Taxonomy"("taxonomy") ON DELETE CASCADE ON UPDATE CASCADE;
