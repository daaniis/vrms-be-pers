/*
  Warnings:

  - Changed the type of `variable_type` on the `Variable` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "VariableType" AS ENUM ('Translation', 'NonTranslation', 'Vendor');

-- AlterTable
ALTER TABLE "Variable" DROP COLUMN "variable_type",
ADD COLUMN     "variable_type" "VariableType" NOT NULL;
