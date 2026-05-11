/*
  Warnings:

  - You are about to drop the column `proposedThumbnailDirection` on the `VideoProject` table. All the data in the column will be lost.
  - You are about to drop the column `selectedThumbnailDirection` on the `VideoProject` table. All the data in the column will be lost.
  - You are about to drop the column `shortlistedThumbnailDirection` on the `VideoProject` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VideoProject" DROP COLUMN "proposedThumbnailDirection",
DROP COLUMN "selectedThumbnailDirection",
DROP COLUMN "shortlistedThumbnailDirection";
