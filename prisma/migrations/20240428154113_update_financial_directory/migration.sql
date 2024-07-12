/*
  Warnings:

  - You are about to drop the column `financial_directory_file` on the `FinancialDirectory` table. All the data in the column will be lost.
  - You are about to drop the column `financial_directory_original` on the `FinancialDirectory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FinancialDirectory" DROP COLUMN "financial_directory_file",
DROP COLUMN "financial_directory_original";

-- CreateTable
CREATE TABLE "File" (
    "file_id" SERIAL NOT NULL,
    "original_name" TEXT NOT NULL,
    "stored_name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "financial_directory_id" INTEGER NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("file_id")
);

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_financial_directory_id_fkey" FOREIGN KEY ("financial_directory_id") REFERENCES "FinancialDirectory"("financial_directory_id") ON DELETE RESTRICT ON UPDATE CASCADE;
