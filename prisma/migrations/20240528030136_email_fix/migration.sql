/*
  Warnings:

  - You are about to drop the column `freelance_id` on the `Attachments` table. All the data in the column will be lost.
  - You are about to drop the column `vendor_id` on the `Attachments` table. All the data in the column will be lost.
  - You are about to drop the column `freelance_id` on the `ListRate` table. All the data in the column will be lost.
  - You are about to drop the column `vendor_id` on the `ListRate` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Attachments" DROP CONSTRAINT "Attachments_freelance_id_fkey";

-- DropForeignKey
ALTER TABLE "Attachments" DROP CONSTRAINT "Attachments_vendor_id_fkey";

-- DropForeignKey
ALTER TABLE "ListRate" DROP CONSTRAINT "ListRate_freelance_id_fkey";

-- DropForeignKey
ALTER TABLE "ListRate" DROP CONSTRAINT "ListRate_vendor_id_fkey";

-- DropIndex
DROP INDEX "Freelance_email_key";

-- DropIndex
DROP INDEX "Vendor_email_key";

-- AlterTable
ALTER TABLE "Attachments" DROP COLUMN "freelance_id",
DROP COLUMN "vendor_id";

-- AlterTable
ALTER TABLE "ListRate" DROP COLUMN "freelance_id",
DROP COLUMN "vendor_id";
