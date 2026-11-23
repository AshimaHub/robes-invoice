import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const existing = await prisma.user.findFirst({
  where: { email: { in: ["admin@acmefoods.demo", "admin"] } },
});

if (!existing) {
  console.log("No admin user to update");
} else {
  const passwordHash = await bcrypt.hash("0000", 10);
  await prisma.user.update({
    where: { id: existing.id },
    data: { email: "admin", passwordHash },
  });
  console.log("Dummy admin login set");
}

await prisma.$disconnect();
