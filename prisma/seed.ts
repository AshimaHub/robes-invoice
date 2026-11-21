import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const tenant = await prisma.tenant.create({
    data: {
      name: "Acme Foods",
      slug: "acme-foods",
      legalName: "Acme Foods Nigeria Limited",
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
            "Company invoicing and NRS-compliant e-invoice tools — Robes Invoice demo.",
          emailFromName: "Robes Invoice",
          domainHint: "invoice.robes.demo",
          logoUrl: null,
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
      email: "admin@acmefoods.demo",
      name: "Ada Okonkwo",
      passwordHash,
      memberships: {
        create: { tenantId: tenant.id, role: "TENANT_ADMIN" },
      },
    },
  });

  const issuer = await prisma.user.create({
    data: {
      email: "issuer@acmefoods.demo",
      name: "Chidi Eze",
      passwordHash,
      memberships: {
        create: { tenantId: tenant.id, role: "ISSUER" },
      },
    },
  });

  const party = await prisma.party.create({
    data: {
      tenantId: tenant.id,
      type: "CUSTOMER",
      name: "Lagos Wholesale Mart",
      tin: "87654321-0001",
      email: "ap@lagoswholesale.demo",
      addressLine1: "45 Trade Fair Complex",
      city: "Lagos",
      state: "Lagos",
      lga: "Ojo",
    },
  });

  await prisma.auditEvent.create({
    data: {
      tenantId: tenant.id,
      userId: admin.id,
      action: "SEED_DEMO_TENANT",
      entity: "Tenant",
      entityId: tenant.id,
      meta: JSON.stringify({ issuerId: issuer.id, partyId: party.id }),
    },
  });

  console.log("Seeded Robes Invoice demo tenant (sample org: Acme Foods)");
  console.log("  Admin:  admin@acmefoods.demo / demo1234");
  console.log("  Issuer: issuer@acmefoods.demo / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
