/*
  Warnings:

  - You are about to drop the column `action` on the `LogActivity` table. All the data in the column will be lost.
  - Added the required column `item_id` to the `LogActivity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LogActivity" DROP COLUMN "action",
ADD COLUMN     "item_id" TEXT NOT NULL;
