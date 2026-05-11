/*
  Warnings:

  - You are about to drop the column `selectedHook` on the `VideoProject` table. All the data in the column will be lost.
  - You are about to drop the column `selectedTitle` on the `VideoProject` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VideoProject" DROP COLUMN "selectedHook",
DROP COLUMN "selectedTitle",
ADD COLUMN     "hook" TEXT;
