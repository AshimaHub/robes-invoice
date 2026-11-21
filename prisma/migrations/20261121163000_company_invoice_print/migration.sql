-- AlterTable Branding: company invoice letterhead prefs
ALTER TABLE "Branding" ADD COLUMN "invoiceCompanyName" TEXT;
ALTER TABLE "Branding" ADD COLUMN "invoicePhone" TEXT;
ALTER TABLE "Branding" ADD COLUMN "invoiceEmail" TEXT;

-- AlterTable Invoice: standard commercial invoice fields + optional QR
ALTER TABLE "Invoice" ADD COLUMN "dueDate" DATETIME;
ALTER TABLE "Invoice" ADD COLUMN "paymentTerms" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "sellerName" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "sellerAddress" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "sellerPhone" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "sellerEmail" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "sellerTin" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "buyerName" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "buyerAddress" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "buyerEmail" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "buyerPhone" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "includeQr" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Invoice" ADD COLUMN "logoSnapshotUrl" TEXT;
