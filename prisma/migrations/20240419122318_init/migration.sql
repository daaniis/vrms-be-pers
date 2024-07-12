-- CreateEnum
CREATE TYPE "TypeFreelance" AS ENUM ('Translation', 'NonTranslation');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "TypeResource" AS ENUM ('Freelance', 'Vendor');

-- CreateEnum
CREATE TYPE "StatusApproval" AS ENUM ('Approved', 'Rejected', 'Pending');

-- CreateEnum
CREATE TYPE "StatusAttachment" AS ENUM ('Uploaded', 'NotYet');

-- CreateEnum
CREATE TYPE "CalcUnit" AS ENUM ('Hourly', 'Daily', 'Monthly', 'Project');

-- CreateTable
CREATE TABLE "Country" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "iso3" TEXT NOT NULL,
    "iso2" TEXT NOT NULL,
    "region" TEXT,
    "subregion" TEXT,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "State" (
    "id" INTEGER NOT NULL,
    "country_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "state_code" TEXT NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "state_id" INTEGER NOT NULL,
    "country_id" INTEGER NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Currency" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Freelance" (
    "freelance_id" TEXT NOT NULL,
    "type_freelance" "TypeFreelance" NOT NULL,
    "username" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "language_from_id" INTEGER,
    "language_to_id" INTEGER,
    "specialization_on" TEXT,
    "tools" JSONB,
    "country_id" INTEGER NOT NULL,
    "state_id" INTEGER NOT NULL,
    "city_id" INTEGER NOT NULL,
    "district" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "full_address" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_holder_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "name_tax" TEXT NOT NULL,
    "resource_status" "ResourceStatus" NOT NULL,
    "npwp_number" TEXT NOT NULL,
    "currency_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Freelance_pkey" PRIMARY KEY ("freelance_id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "vendor_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "pic_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contact_via" TEXT NOT NULL,
    "country_id" INTEGER NOT NULL,
    "state_id" INTEGER NOT NULL,
    "city_id" INTEGER NOT NULL,
    "district" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "full_address" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_holder_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "name_tax" TEXT NOT NULL,
    "resource_status" "ResourceStatus" NOT NULL,
    "npwp_number" TEXT NOT NULL,
    "currency_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("vendor_id")
);

-- CreateTable
CREATE TABLE "PMNotes" (
    "pm_notes_id" SERIAL NOT NULL,
    "type_resource" "TypeResource" NOT NULL,
    "freelance_id" TEXT,
    "vendor_id" TEXT,
    "note" TEXT NOT NULL,
    "reply" TEXT,
    "status_approval" "StatusApproval" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "user_note_id" INTEGER NOT NULL,
    "user_reply_id" INTEGER,

    CONSTRAINT "PMNotes_pkey" PRIMARY KEY ("pm_notes_id")
);

-- CreateTable
CREATE TABLE "SubmitRating" (
    "submit_rating_id" SERIAL NOT NULL,
    "type_resource" "TypeResource" NOT NULL,
    "freelance_id" TEXT,
    "vendor_id" TEXT,
    "rating" DOUBLE PRECISION NOT NULL,
    "project_name" TEXT NOT NULL,
    "review" TEXT NOT NULL,
    "upload_file" TEXT,
    "submited_by" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmitRating_pkey" PRIMARY KEY ("submit_rating_id")
);

-- CreateTable
CREATE TABLE "Attachments" (
    "attachment_id" SERIAL NOT NULL,
    "type_resource" "TypeResource" NOT NULL,
    "freelance_id" TEXT,
    "vendor_id" TEXT,
    "attachment_name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status_attachment" "StatusAttachment" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attachments_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateTable
CREATE TABLE "ListRate" (
    "list_rate_id" SERIAL NOT NULL,
    "type_resource" "TypeResource" NOT NULL,
    "freelance_id" TEXT,
    "vendor_id" TEXT,
    "type_of_service" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "rate_type_id" INTEGER NOT NULL,
    "calc_unit" "CalcUnit" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListRate_pkey" PRIMARY KEY ("list_rate_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "State_name_key" ON "State"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Freelance_email_key" ON "Freelance"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PMNotes_user_note_id_key" ON "PMNotes"("user_note_id");

-- CreateIndex
CREATE UNIQUE INDEX "PMNotes_user_reply_id_key" ON "PMNotes"("user_reply_id");

-- AddForeignKey
ALTER TABLE "State" ADD CONSTRAINT "State_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "State"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Freelance" ADD CONSTRAINT "Freelance_language_from_id_fkey" FOREIGN KEY ("language_from_id") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Freelance" ADD CONSTRAINT "Freelance_language_to_id_fkey" FOREIGN KEY ("language_to_id") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Freelance" ADD CONSTRAINT "Freelance_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Freelance" ADD CONSTRAINT "Freelance_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "State"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Freelance" ADD CONSTRAINT "Freelance_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Freelance" ADD CONSTRAINT "Freelance_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMNotes" ADD CONSTRAINT "PMNotes_freelance_id_fkey" FOREIGN KEY ("freelance_id") REFERENCES "Freelance"("freelance_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMNotes" ADD CONSTRAINT "PMNotes_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("vendor_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMNotes" ADD CONSTRAINT "PMNotes_user_note_id_fkey" FOREIGN KEY ("user_note_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMNotes" ADD CONSTRAINT "PMNotes_user_reply_id_fkey" FOREIGN KEY ("user_reply_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmitRating" ADD CONSTRAINT "SubmitRating_freelance_id_fkey" FOREIGN KEY ("freelance_id") REFERENCES "Freelance"("freelance_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmitRating" ADD CONSTRAINT "SubmitRating_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("vendor_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmitRating" ADD CONSTRAINT "SubmitRating_submited_by_fkey" FOREIGN KEY ("submited_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachments" ADD CONSTRAINT "Attachments_freelance_id_fkey" FOREIGN KEY ("freelance_id") REFERENCES "Freelance"("freelance_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachments" ADD CONSTRAINT "Attachments_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("vendor_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListRate" ADD CONSTRAINT "ListRate_freelance_id_fkey" FOREIGN KEY ("freelance_id") REFERENCES "Freelance"("freelance_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListRate" ADD CONSTRAINT "ListRate_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("vendor_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListRate" ADD CONSTRAINT "ListRate_rate_type_id_fkey" FOREIGN KEY ("rate_type_id") REFERENCES "RateType"("rate_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;
