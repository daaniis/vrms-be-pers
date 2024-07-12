/*
  Warnings:

  - You are about to drop the column `action` on the `LogActivity` table. All the data in the column will be lost.
  - You are about to drop the column `upload_file` on the `SubmitRating` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[attachment_name]` on the table `Attachments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `Vendor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Vendor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `item_id` to the `LogActivity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variable_type` to the `Variable` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable

-- AlterTable