/*
  Warnings:

  - The values [Freelance,FreelanceDenganNPWP,FreelanceTanpaNPWP] on the enum `ResourceStatusFreelance` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ResourceStatusFreelance_new" AS ENUM ('FreelanceNPWP', 'FreelanceNonNPWP');
ALTER TABLE "Freelance" ALTER COLUMN "resource_status" TYPE "ResourceStatusFreelance_new" USING ("resource_status"::text::"ResourceStatusFreelance_new");
ALTER TYPE "ResourceStatusFreelance" RENAME TO "ResourceStatusFreelance_old";
ALTER TYPE "ResourceStatusFreelance_new" RENAME TO "ResourceStatusFreelance";
DROP TYPE "ResourceStatusFreelance_old";
COMMIT;
