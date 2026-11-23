import { PrismaClient } from "@prisma/client";
import { createCompanyInvoice } from "../src/lib/invoices";

async function main() {
  const prisma = new PrismaClient();
  try {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { slug: "acme-foods" },
    });
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "admin" },
    });
    const party = await prisma.party.findFirstOrThrow({
      where: { tenantId: tenant.id },
    });
    const inv = await createCompanyInvoice({
      tenantId: tenant.id,
      userId: user.id,
      partyId: party.id,
      seller: {
        name: tenant.legalName,
        address: "12 Warehouse Road, Lagos",
        phone: "+234 800 000 0000",
        email: "billing@acmefoods.demo",
        tin: tenant.tin,
      },
      buyer: {
        name: party.name,
        address: "45 Trade Fair Complex, Lagos",
        phone: party.phone || undefined,
        email: party.email || undefined,
      },
      includeQr: true,
      dueDate: new Date(Date.now() + 14 * 86400000),
      paymentTerms: "Net 14 days",
      lines: [{ description: "Demo line", quantity: 1, unitPrice: 10000, vatRate: 7.5 }],
    });
    if (
      inv.channel !== "COMPANY" ||
      inv.status !== "ISSUED" ||
      inv.irn ||
      !inv.includeQr ||
      !inv.qrSvg ||
      !inv.sellerName
    ) {
      throw new Error(`Unexpected company invoice shape: ${JSON.stringify(inv)}`);
    }
    console.log(
      "OK company",
      inv.invoiceNumber,
      inv.channel,
      inv.status,
      "qr=yes",
      `view=/company/invoices/${inv.id}/view`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
