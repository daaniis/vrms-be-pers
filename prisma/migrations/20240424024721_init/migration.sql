/*
  Warnings:

  - You are about to drop the column `submited_by` on the `SubmitRating` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `SubmitRating` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SubmitRating" DROP CONSTRAINT "SubmitRating_submited_by_fkey";

-- AlterTable
ALTER TABLE "SubmitRating" DROP COLUMN "submited_by",
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "SubmitRating" ADD CONSTRAINT "SubmitRating_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
