/*
  Warnings:

  - You are about to drop the column `item_id` on the `RecordLog` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `RecordLog` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `action` to the `RecordLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `data_name` to the `RecordLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `field` to the `RecordLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_by_email` to the `RecordLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RecordLog" DROP COLUMN "item_id",
DROP COLUMN "user_id",
ADD COLUMN     "action" TEXT NOT NULL,
ADD COLUMN     "data_name" TEXT NOT NULL,
ADD COLUMN     "field" TEXT NOT NULL,
ADD COLUMN     "freelanceFreelance_id" TEXT,
ADD COLUMN     "updated_by_email" TEXT NOT NULL,
ALTER COLUMN "old_value" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "RecordLog" ADD CONSTRAINT "RecordLog_updated_by_email_fkey" FOREIGN KEY ("updated_by_email") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordLog" ADD CONSTRAINT "RecordLog_freelanceFreelance_id_fkey" FOREIGN KEY ("freelanceFreelance_id") REFERENCES "Freelance"("freelance_id") ON DELETE SET NULL ON UPDATE CASCADE;
