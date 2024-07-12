/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `Freelance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Freelance_username_key" ON "Freelance"("username");
