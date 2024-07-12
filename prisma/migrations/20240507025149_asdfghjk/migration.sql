/*
  Warnings:

  - You are about to drop the column `token_blacklist` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "token_blacklist";
