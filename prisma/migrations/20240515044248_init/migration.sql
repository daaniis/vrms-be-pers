-- AddForeignKey
ALTER TABLE "RecordLog" ADD CONSTRAINT "RecordLog_updated_by_email_fkey" FOREIGN KEY ("updated_by_email") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
