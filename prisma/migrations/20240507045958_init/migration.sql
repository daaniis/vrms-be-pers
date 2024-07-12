/*
  Warnings:

  - You are about to drop the `LogActivity` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LogActivity" DROP CONSTRAINT "LogActivity_menu_id_fkey";

-- DropTable
DROP TABLE "LogActivity";

-- CreateTable
CREATE TABLE "RecordLog" (
    "log_activity_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "menu_id" INTEGER NOT NULL,
    "item_id" TEXT NOT NULL,
    "old_value" TEXT NOT NULL,
    "new_value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecordLog_pkey" PRIMARY KEY ("log_activity_id")
);

-- AddForeignKey
ALTER TABLE "RecordLog" ADD CONSTRAINT "RecordLog_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "Menu"("menu_id") ON DELETE RESTRICT ON UPDATE CASCADE;
