/*
  Warnings:

  - The `upload_file` column on the `SubmitRating` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "SubmitRating" DROP COLUMN "upload_file",
ADD COLUMN     "upload_file" JSONB;
