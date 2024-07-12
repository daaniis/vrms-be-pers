/*
  Warnings:

  - The values [Hourly,Daily,Monthly,Project] on the enum `CalcUnit` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CalcUnit_new" AS ENUM ('Minute', 'Hour', 'Day', 'Month', 'Year', 'SourceWord', 'SourceCharacter', 'Page', 'Image', 'Package', 'Lifetime');
ALTER TABLE "ListRate" ALTER COLUMN "calc_unit" TYPE "CalcUnit_new" USING ("calc_unit"::text::"CalcUnit_new");
ALTER TYPE "CalcUnit" RENAME TO "CalcUnit_old";
ALTER TYPE "CalcUnit_new" RENAME TO "CalcUnit";
DROP TYPE "CalcUnit_old";
COMMIT;
