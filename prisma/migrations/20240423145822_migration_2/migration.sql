/*
  Warnings:

  - Added the required column `financial_directory_original` to the `FinancialDirectory` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PMNotes_user_note_id_key";

-- DropIndex
DROP INDEX "PMNotes_user_reply_id_key";

-- AlterTable
ALTER TABLE "FinancialDirectory" ADD COLUMN     "financial_directory_original" JSONB NOT NULL;
