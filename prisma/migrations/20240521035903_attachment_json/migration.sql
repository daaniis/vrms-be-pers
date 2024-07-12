/*
  Warnings:

  - You are about to drop the column `freelance_id` on the `Attachments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Attachments" DROP CONSTRAINT "Attachments_freelance_id_fkey";

-- AlterTable
ALTER TABLE "Attachments" DROP COLUMN "freelance_id";

-- AlterTable
ALTER TABLE "Freelance" ADD COLUMN     "attachments" JSONB;
