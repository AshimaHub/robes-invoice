import { PrismaClient } from "@prisma/client";
import { createCompanyInvoice } from "../src/lib/invoices";

async function main() {
  const prisma = new PrismaClient();
  try {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { slug: "acme-foods" },
    });
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@acmefoods.demo" },
    });
    const party = await prisma.party.findFirstOrThrow({
      where: { tenantId: tenant.id },
    });
    const inv = await createCompanyInvoice({
      tenantId: tenant.id,
      userId: user.id,
      partyId: party.id,
      lines: [{ description: "Demo line", quantity: 1, unitPrice: 10000 }],
    });
    if (inv.channel !== "COMPANY" || inv.status !== "ISSUED" || inv.irn) {
      throw new Error(`Unexpected company invoice shape: ${JSON.stringify(inv)}`);
    }
    console.log("OK company", inv.invoiceNumber, inv.channel, inv.status);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
