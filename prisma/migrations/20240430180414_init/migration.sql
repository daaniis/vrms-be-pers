/*
  Warnings:

  - You are about to drop the column `upload_file` on the `SubmitRating` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SubmitRating" DROP COLUMN "upload_file",
ADD COLUMN     "files" JSONB;
