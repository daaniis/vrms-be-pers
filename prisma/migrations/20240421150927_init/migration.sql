/*
  Warnings:

  - You are about to drop the column `path` on the `Attachments` table. All the data in the column will be lost.
  - Added the required column `original_name` to the `Attachments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Attachments" DROP COLUMN "path",
ADD COLUMN     "original_name" TEXT NOT NULL;
