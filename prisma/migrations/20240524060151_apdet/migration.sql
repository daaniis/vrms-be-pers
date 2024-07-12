/*
  Warnings:

  - You are about to drop the column `attachments` on the `Freelance` table. All the data in the column will be lost.
  - You are about to drop the column `deleted` on the `Freelance` table. All the data in the column will be lost.
  - You are about to drop the column `list_rate` on the `Freelance` table. All the data in the column will be lost.
  - You are about to drop the column `attachments` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `deleted` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `list_rate` on the `Vendor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Attachments" ADD COLUMN     "freelance_id" TEXT,
ADD COLUMN     "vendor_id" TEXT;

-- AlterTable
ALTER TABLE "Freelance" DROP COLUMN "attachments",
DROP COLUMN "deleted",
DROP COLUMN "list_rate";

-- AlterTable
ALTER TABLE "ListRate" ADD COLUMN     "freelance_id" TEXT,
ADD COLUMN     "vendor_id" TEXT;

-- AlterTable
ALTER TABLE "Vendor" DROP COLUMN "attachments",
DROP COLUMN "deleted",
DROP COLUMN "list_rate";

-- AddForeignKey
ALTER TABLE "Attachments" ADD CONSTRAINT "Attachments_freelance_id_fkey" FOREIGN KEY ("freelance_id") REFERENCES "Freelance"("freelance_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachments" ADD CONSTRAINT "Attachments_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("vendor_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListRate" ADD CONSTRAINT "ListRate_freelance_id_fkey" FOREIGN KEY ("freelance_id") REFERENCES "Freelance"("freelance_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListRate" ADD CONSTRAINT "ListRate_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("vendor_id") ON DELETE SET NULL ON UPDATE CASCADE;
