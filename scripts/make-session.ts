import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "admin" },
    include: { memberships: { include: { tenant: true }, take: 1 } },
  });
  if (!user?.memberships[0]) throw new Error("demo user missing — run npm run db:seed");
  const m = user.memberships[0];
  const session = {
    userId: user.id,
    email: user.email,
    name: user.name,
    tenantId: m.tenantId,
    tenantSlug: m.tenant.slug,
    tenantName: m.tenant.name,
    role: m.role,
  };
  process.stdout.write(Buffer.from(JSON.stringify(session), "utf8").toString("base64url"));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

