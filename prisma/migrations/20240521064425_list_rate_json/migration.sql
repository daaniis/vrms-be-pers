/*
  Warnings:

  - You are about to drop the column `freelance_id` on the `ListRate` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ListRate" DROP CONSTRAINT "ListRate_freelance_id_fkey";

-- AlterTable
ALTER TABLE "Freelance" ADD COLUMN     "list_rate" JSONB;

-- AlterTable
ALTER TABLE "ListRate" DROP COLUMN "freelance_id";
