-- CreateTable
CREATE TABLE "NrsGateProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answersJson" TEXT NOT NULL DEFAULT '{}',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NrsGateProgress_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NrsGateProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "partyId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'COMPANY',
    "documentType" TEXT NOT NULL DEFAULT 'INVOICE',
    "invoiceKind" TEXT NOT NULL DEFAULT 'B2B',
    "invoiceNumber" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "irn" TEXT,
    "qrPayload" TEXT,
    "qrSvg" TEXT,
    "mockClearanceAt" DATETIME,
    "validationMsg" TEXT,
    "notes" TEXT,
    "relatedInvoiceId" TEXT,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "vatTotal" REAL NOT NULL DEFAULT 0,
    "grandTotal" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invoice_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_relatedInvoiceId_fkey" FOREIGN KEY ("relatedInvoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("createdAt", "currency", "documentType", "grandTotal", "id", "invoiceKind", "invoiceNumber", "irn", "issueDate", "mockClearanceAt", "notes", "partyId", "qrPayload", "qrSvg", "relatedInvoiceId", "status", "subtotal", "tenantId", "updatedAt", "validationMsg", "vatTotal") SELECT "createdAt", "currency", "documentType", "grandTotal", "id", "invoiceKind", "invoiceNumber", "irn", "issueDate", "mockClearanceAt", "notes", "partyId", "qrPayload", "qrSvg", "relatedInvoiceId", "status", "subtotal", "tenantId", "updatedAt", "validationMsg", "vatTotal" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE INDEX "Invoice_tenantId_status_idx" ON "Invoice"("tenantId", "status");
CREATE INDEX "Invoice_tenantId_channel_idx" ON "Invoice"("tenantId", "channel");
CREATE UNIQUE INDEX "Invoice_tenantId_invoiceNumber_key" ON "Invoice"("tenantId", "invoiceNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "NrsGateProgress_tenantId_userId_key" ON "NrsGateProgress"("tenantId", "userId");
