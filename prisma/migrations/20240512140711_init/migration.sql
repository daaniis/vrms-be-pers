/*
  Warnings:

  - You are about to drop the column `status_attachment` on the `Attachments` table. All the data in the column will be lost.
  - Changed the type of `resource_status` on the `Freelance` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `resource_status` on the `Vendor` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ResourceStatusFreelance" AS ENUM ('Freelance', 'FreelanceDenganNPWP', 'FreelanceTanpaNPWP');

-- CreateEnum
CREATE TYPE "ResourceStatusVendor" AS ENUM ('VendorPKP', 'VendorNonPKP');

-- AlterTable
ALTER TABLE "Attachments" DROP COLUMN "status_attachment";

-- AlterTable
ALTER TABLE "Freelance" DROP COLUMN "resource_status",
ADD COLUMN     "resource_status" "ResourceStatusFreelance" NOT NULL;

-- AlterTable
ALTER TABLE "Vendor" DROP COLUMN "resource_status",
ADD COLUMN     "resource_status" "ResourceStatusVendor" NOT NULL;

-- DropEnum
DROP TYPE "ResourceStatus";

-- DropEnum
DROP TYPE "StatusAttachment";
