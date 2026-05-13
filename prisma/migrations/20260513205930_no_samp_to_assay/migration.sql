/*
  Warnings:

  - You are about to drop the `_AssayToSample` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_AssayToSample" DROP CONSTRAINT "_AssayToSample_A_fkey";

-- DropForeignKey
ALTER TABLE "_AssayToSample" DROP CONSTRAINT "_AssayToSample_B_fkey";

-- DropTable
DROP TABLE "_AssayToSample";
