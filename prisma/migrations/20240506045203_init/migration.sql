/*
  Warnings:

  - Added the required column `financial_directory_total` to the `FinancialDirectory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FinancialDirectory" ADD COLUMN     "financial_directory_total" INTEGER NOT NULL;
