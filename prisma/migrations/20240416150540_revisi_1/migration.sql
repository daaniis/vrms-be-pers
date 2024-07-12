/*
  Warnings:

  - The primary key for the `RateType` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `RateType` table. All the data in the column will be lost.
  - The primary key for the `Template` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Template` table. All the data in the column will be lost.
  - The primary key for the `Variable` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Variable` table. All the data in the column will be lost.
  - You are about to drop the `Tools` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "RateType" DROP CONSTRAINT "RateType_pkey",
DROP COLUMN "id",
ADD COLUMN     "rate_type_id" SERIAL NOT NULL,
ADD CONSTRAINT "RateType_pkey" PRIMARY KEY ("rate_type_id");

-- AlterTable
ALTER TABLE "Template" DROP CONSTRAINT "Template_pkey",
DROP COLUMN "id",
ADD COLUMN     "template_id" SERIAL NOT NULL,
ADD CONSTRAINT "Template_pkey" PRIMARY KEY ("template_id");

-- AlterTable
ALTER TABLE "Variable" DROP CONSTRAINT "Variable_pkey",
DROP COLUMN "id",
ADD COLUMN     "variable_id" SERIAL NOT NULL,
ADD CONSTRAINT "Variable_pkey" PRIMARY KEY ("variable_id");

-- DropTable
DROP TABLE "Tools";

-- CreateTable
CREATE TABLE "Tool" (
    "tool_id" SERIAL NOT NULL,
    "tool_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("tool_id")
);

-- CreateTable
CREATE TABLE "FinancialDirectory" (
    "financial_directory_id" SERIAL NOT NULL,
    "financial_directory_name" TEXT NOT NULL,
    "financial_directory_file" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialDirectory_pkey" PRIMARY KEY ("financial_directory_id")
);
