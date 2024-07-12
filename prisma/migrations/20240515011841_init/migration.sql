/*
  Warnings:

  - You are about to drop the column `freelanceFreelance_id` on the `RecordLog` table. All the data in the column will be lost.
  - You are about to drop the column `menu_id` on the `RecordLog` table. All the data in the column will be lost.
  - Added the required column `menu_name` to the `RecordLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RecordLog" DROP CONSTRAINT "RecordLog_freelanceFreelance_id_fkey";

-- DropForeignKey
ALTER TABLE "RecordLog" DROP CONSTRAINT "RecordLog_menu_id_fkey";

-- AlterTable
ALTER TABLE "RecordLog" DROP COLUMN "freelanceFreelance_id",
DROP COLUMN "menu_id",
ADD COLUMN     "menu_name" TEXT NOT NULL;
