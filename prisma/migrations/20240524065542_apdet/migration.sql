-- AlterTable
ALTER TABLE "Freelance" ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "list_rate" JSONB;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "list_rate" JSONB;
