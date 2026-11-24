import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";

const prisma = new PrismaClient();

async function main() {
  await prisma.clearanceEvent.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.party.deleteMany();
  await prisma.credential.deleteMany();
  await prisma.branding.deleteMany();
  await prisma.nrsGateProgress.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  const adminPasswordHash = await bcrypt.hash("0000", 10);
  const issuerPasswordHash = await bcrypt.hash("demo1234", 10);

  const tenant = await prisma.tenant.create({
    data: {
      name: "Ibrahim Abdullahi & Co",
      slug: "ibrahim-abdullahi",
      legalName: "Ibrahim Abdullahi & Co",
      tin: "12345678-0001",
      businessId: "MBS-BUS-ACME-001",
      serviceId: "SVC-ACME-DEMO",
      addressLine1: "12 Warehouse Road",
      city: "Lagos",
      state: "Lagos",
      lga: "Apapa",
      nrsEnv: "SANDBOX",
      branding: {
        create: {
          primaryColor: "#0B5E3C",
          secondaryColor: "#C4A35A",
          accentColor: "#143D2B",
          loginHeroText:
            "Company invoicing and NRS-compliant e-invoice tools.",
          emailFromName: "Ibrahim Abdullahi & Co",
          domainHint: "invoice.robes.demo",
          logoUrl: "/brand/ibrahim-abdullahi-logo.jpg",
          invoiceCompanyName: "Ibrahim Abdullahi & Co",
          invoicePhone: "+234 801 111 2233",
          invoiceEmail: null,
        },
      },
      credentials: {
        create: {
          environment: "SANDBOX",
          label: "Mock sandbox vault (no live keys)",
          encryptedBlob: Buffer.from(
            JSON.stringify({
              note: "Stub only — MockNrsAdapter used until real sandbox keys exist",
              apiKey: "MOCK-KEY",
            }),
          ).toString("base64"),
        },
      },
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin",
      name: "Admin",
      passwordHash: adminPasswordHash,
      memberships: {
        create: { tenantId: tenant.id, role: "TENANT_ADMIN" },
      },
    },
  });

  const issuer = await prisma.user.create({
    data: {
      email: "issuer@acmefoods.demo",
      name: "Chidi Eze",
      passwordHash: issuerPasswordHash,
      memberships: {
        create: { tenantId: tenant.id, role: "ISSUER" },
      },
    },
  });

  const gateAnswers = JSON.stringify({
    einvoice_enabled: "yes",
    tin_registered: "yes",
    business_service_id: "yes",
    credentials_ready: "yes",
    env_awareness: "yes",
  });

  await prisma.nrsGateProgress.create({
    data: {
      tenantId: tenant.id,
      userId: issuer.id,
      answersJson: gateAnswers,
      completed: true,
      completedAt: new Date(),
    },
  });

  const party = await prisma.party.create({
    data: {
      tenantId: tenant.id,
      type: "CUSTOMER",
      name: "Lagos Wholesale Mart",
      tin: "87654321-0001",
      email: "ap@lagoswholesale.demo",
      phone: "+234 801 000 0000",
      addressLine1: "45 Trade Fair Complex",
      city: "Lagos",
      state: "Lagos",
      lga: "Ojo",
    },
  });

  const issueDate = new Date("2025-01-26T09:42:31.000Z");
  const lines = [
    {
      description: "Reservation of Name",
      quantity: 1,
      unitPrice: 1000,
      vatRate: 7.5,
      lineTotal: 1000,
      vatAmount: 75,
    },
    {
      description: "Business Name Registration (demo line)",
      quantity: 1,
      unitPrice: 500,
      vatRate: 7.5,
      lineTotal: 500,
      vatAmount: 37.5,
    },
  ];
  const subtotal = 1500;
  const vatTotal = 112.5;
  const grandTotal = 1612.5;
  const invoiceNumber = "INV-00001";
  const ymd = "20250126";
  const irn = `${invoiceNumber}-${tenant.serviceId}-${ymd}`;
  const qrPayload = JSON.stringify({
    irn,
    tin: tenant.tin,
    amount: grandTotal,
    currency: "NGN",
    mode: "MOCK_SANDBOX",
    verifiedAt: issueDate.toISOString(),
  });
  const qrSvg = await QRCode.toString(qrPayload, {
    type: "svg",
    margin: 1,
    width: 180,
    color: { dark: "#143D2B", light: "#FFFFFF" },
  });

  const nrsInvoice = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      partyId: party.id,
      channel: "NRS",
      documentType: "INVOICE",
      invoiceKind: "B2B",
      invoiceNumber,
      issueDate,
      status: "VALID",
      irn,
      qrPayload,
      qrSvg,
      mockClearanceAt: issueDate,
      validationMsg: "Mock clearance accepted (sandbox simulator — not live NRS).",
      notes: "Seeded demo cleared NRS e-invoice for document view.",
      subtotal,
      vatTotal,
      grandTotal,
      lines: { create: lines },
      events: {
        create: [
          {
            status: "SUBMITTED",
            message: "Submitted to MockNrsAdapter (not live NRS).",
            createdAt: new Date(issueDate.getTime() - 1000),
          },
          {
            status: "VALID",
            message: "Mock clearance accepted (sandbox simulator — not live NRS).",
            createdAt: issueDate,
          },
        ],
      },
    },
  });

  const companyIssue = new Date();
  const companyDue = new Date(companyIssue.getTime() + 14 * 86400000);
  const companyLines = [
    {
      description: "Wholesale dry goods (company channel)",
      quantity: 10,
      unitPrice: 1000,
      vatRate: 7.5,
      lineTotal: 10000,
      vatAmount: 750,
    },
  ];
  const companySubtotal = 10000;
  const companyVat = 750;
  const companyTotal = 10750;
  const companyNumber = "CI-00001";
  const companyQrPayload = JSON.stringify({
    type: "robes.company_invoice",
    version: 1,
    invoiceNumber: companyNumber,
    issueDate: companyIssue.toISOString().slice(0, 10),
    dueDate: companyDue.toISOString().slice(0, 10),
    currency: "NGN",
    seller: { name: "Ibrahim Abdullahi & Co", tin: tenant.tin },
    buyer: { name: party.name },
    totals: {
      subtotal: companySubtotal,
      tax: companyVat,
      grandTotal: companyTotal,
    },
    lines: companyLines.map((l) => ({
      description: l.description,
      qty: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
      tax: l.vatAmount,
    })),
  });
  const companyQrSvg = await QRCode.toString(companyQrPayload, {
    type: "svg",
    margin: 1,
    width: 160,
    color: { dark: "#143D2B", light: "#FFFFFF" },
  });

  const companyInvoice = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      partyId: party.id,
      channel: "COMPANY",
      documentType: "INVOICE",
      invoiceKind: "B2B",
      invoiceNumber: companyNumber,
      issueDate: companyIssue,
      dueDate: companyDue,
      currency: "NGN",
      status: "ISSUED",
      notes: "Sample company invoice (commercial only — not NRS).",
      paymentTerms: "Net 14 days · Bank transfer",
      sellerName: "Ibrahim Abdullahi & Co",
      sellerAddress: "12 Warehouse Road\nLagos, Lagos\nNigeria",
      sellerPhone: "+234 801 111 2233",
      sellerEmail: null,
      sellerTin: tenant.tin,
      buyerName: party.name,
      buyerAddress: "45 Trade Fair Complex\nLagos, Lagos\nNigeria",
      buyerEmail: party.email,
      buyerPhone: party.phone,
      includeQr: true,
      logoSnapshotUrl: "/uploads/demo/acme-logo.svg",
      qrPayload: companyQrPayload,
      qrSvg: companyQrSvg,
      subtotal: companySubtotal,
      vatTotal: companyVat,
      grandTotal: companyTotal,
      lines: { create: companyLines },
    },
  });

  await prisma.auditEvent.create({
    data: {
      tenantId: tenant.id,
      userId: admin.id,
      action: "SEED_DEMO_TENANT",
      entity: "Tenant",
      entityId: tenant.id,
      meta: JSON.stringify({
        issuerId: issuer.id,
        partyId: party.id,
        nrsInvoiceId: nrsInvoice.id,
        nrsInvoiceNumber: nrsInvoice.invoiceNumber,
        companyInvoiceId: companyInvoice.id,
        companyInvoiceNumber: companyInvoice.invoiceNumber,
      }),
    },
  });

  console.log("Seeded demo tenant");
  console.log("  Admin:  admin / 0000");
  console.log("  Issuer: issuer@acmefoods.demo / demo1234");
  console.log("  NRS gate: admin starts on the compliance questions");
  console.log(`  Cleared NRS invoice: ${nrsInvoice.invoiceNumber} id=${nrsInvoice.id}`);
  console.log(`  NRS view: /nrs/invoices/${nrsInvoice.id}/view`);
  console.log(
    `  Company invoice: ${companyInvoice.invoiceNumber} id=${companyInvoice.id}`,
  );
  console.log(`  Company view/print: /company/invoices/${companyInvoice.id}/view`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
