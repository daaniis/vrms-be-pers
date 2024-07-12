-- DropForeignKey
ALTER TABLE "Freelance" DROP CONSTRAINT "Freelance_currency_id_fkey";

-- DropForeignKey
ALTER TABLE "Vendor" DROP CONSTRAINT "Vendor_currency_id_fkey";

-- AlterTable
ALTER TABLE "Freelance" ALTER COLUMN "full_address" DROP NOT NULL,
ALTER COLUMN "bank_name" DROP NOT NULL,
ALTER COLUMN "account_holder_name" DROP NOT NULL,
ALTER COLUMN "account_number" DROP NOT NULL,
ALTER COLUMN "name_tax" DROP NOT NULL,
ALTER COLUMN "npwp_number" DROP NOT NULL,
ALTER COLUMN "currency_id" DROP NOT NULL,
ALTER COLUMN "branch_office" DROP NOT NULL,
ALTER COLUMN "resource_status" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Vendor" ALTER COLUMN "full_address" DROP NOT NULL,
ALTER COLUMN "bank_name" DROP NOT NULL,
ALTER COLUMN "account_holder_name" DROP NOT NULL,
ALTER COLUMN "account_number" DROP NOT NULL,
ALTER COLUMN "name_tax" DROP NOT NULL,
ALTER COLUMN "npwp_number" DROP NOT NULL,
ALTER COLUMN "currency_id" DROP NOT NULL,
ALTER COLUMN "branch_office" DROP NOT NULL,
ALTER COLUMN "resource_status" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Freelance" ADD CONSTRAINT "Freelance_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
