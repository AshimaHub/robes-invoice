import { PrismaClient } from "@prisma/client";
import { createAndClearInvoice } from "../src/lib/invoices";

async function main() {
  const prisma = new PrismaClient();
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { slug: "acme-foods" },
  });
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: "issuer@acmefoods.demo" },
  });
  const party = await prisma.party.findFirstOrThrow({
    where: { tenantId: tenant.id },
  });

  const invoice = await createAndClearInvoice({
    tenantId: tenant.id,
    userId: user.id,
    partyId: party.id,
    invoiceKind: "B2B",
    notes: "Slice 0 verification",
    lines: [
      {
        description: "Verification carton",
        quantity: 2,
        unitPrice: 5000,
        vatRate: 7.5,
      },
    ],
  });

  console.log("OK invoice", invoice.invoiceNumber);
  console.log("OK status", invoice.status);
  console.log("OK irn", invoice.irn);
  console.log("OK qrSvg", Boolean(invoice.qrSvg && invoice.qrSvg.includes("<svg")));

  const credit = await createAndClearInvoice({
    tenantId: tenant.id,
    userId: user.id,
    partyId: party.id,
    documentType: "CREDIT_NOTE",
    relatedInvoiceId: invoice.id,
    notes: "Verification credit",
    lines: [
      {
        description: "Credit verification carton",
        quantity: 1,
        unitPrice: 5000,
        vatRate: 7.5,
      },
    ],
  });

  console.log("OK credit", credit.invoiceNumber, credit.status, credit.irn);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
