-- CreateTable
CREATE TABLE "_LibraryToTaxonomy" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_LibraryToTaxonomy_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_LibraryToTaxonomy_B_index" ON "_LibraryToTaxonomy"("B");

-- AddForeignKey
ALTER TABLE "_LibraryToTaxonomy" ADD CONSTRAINT "_LibraryToTaxonomy_A_fkey" FOREIGN KEY ("A") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LibraryToTaxonomy" ADD CONSTRAINT "_LibraryToTaxonomy_B_fkey" FOREIGN KEY ("B") REFERENCES "Taxonomy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
