/*
  Warnings:

  - You are about to drop the column `vendor_id` on the `Attachments` table. All the data in the column will be lost.
  - You are about to drop the column `vendor_id` on the `ListRate` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Attachments" DROP CONSTRAINT "Attachments_vendor_id_fkey";

-- DropForeignKey
ALTER TABLE "ListRate" DROP CONSTRAINT "ListRate_vendor_id_fkey";

-- AlterTable
ALTER TABLE "Attachments" DROP COLUMN "vendor_id";

-- AlterTable
ALTER TABLE "ListRate" DROP COLUMN "vendor_id";

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "list_rate" JSONB;
