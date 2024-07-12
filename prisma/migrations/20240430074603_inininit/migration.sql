/*
  Warnings:

  - Added the required column `variable_type` to the `Variable` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Variable" ADD COLUMN     "variable_type" "TypeResource" NOT NULL;
