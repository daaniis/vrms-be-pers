/*
  Warnings:

  - You are about to drop the column `freelanceFreelance_id` on the `RecordLog` table. All the data in the column will be lost.

*/
-- DropForeignKey

-- AlterTable
ALTER TABLE "Freelance" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;
