/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Attachments` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Attachments` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ListRate` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ListRate` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `LogActivity` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `LogActivity` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Menu` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Menu` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `PMNotes` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PMNotes` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `SubmitRating` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `SubmitRating` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Vendor` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `Attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `ListRate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `LogActivity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Menu` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `PMNotes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `SubmitRating` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Vendor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Attachments" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ListRate" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "LogActivity" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Menu" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "PMNotes" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SubmitRating" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Vendor" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
