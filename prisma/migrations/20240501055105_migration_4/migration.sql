/*
  Warnings:

  - You are about to drop the column `deleted` on the `FinancialDirectory` table. All the data in the column will be lost.
  - You are about to drop the column `deleted` on the `Template` table. All the data in the column will be lost.
  - You are about to drop the column `deleted` on the `Variable` table. All the data in the column will be lost.
  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `financial_directory_files` to the `FinancialDirectory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_financial_directory_id_fkey";

-- AlterTable
ALTER TABLE "FinancialDirectory" DROP COLUMN "deleted",
ADD COLUMN     "financial_directory_files" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Template" DROP COLUMN "deleted";

-- AlterTable
ALTER TABLE "Variable" DROP COLUMN "deleted";

-- DropTable
DROP TABLE "File";
