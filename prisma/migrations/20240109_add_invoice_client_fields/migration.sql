-- Alter table
ALTER TABLE "Invoice" ADD COLUMN "clientEmail" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "clientAddress" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "dueDate" TIMESTAMP(3);
