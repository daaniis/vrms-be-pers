/*
  Warnings:

  - You are about to drop the `hehe` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `branch_office` to the `Freelance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branch_office` to the `Vendor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Freelance" ADD COLUMN     "branch_office" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "branch_office" TEXT NOT NULL;


