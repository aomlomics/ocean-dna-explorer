/*
  Warnings:

  - A unique constraint covering the columns `[project_id,taxonomy]` on the table `TaxonomySpotlight` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "TaxonomySpotlight_project_id_imageFileUrl_ODE_key";

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomySpotlight_project_id_taxonomy_key" ON "TaxonomySpotlight"("project_id", "taxonomy");
