import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "robes_session";

export type SessionUser = {
  userId: string;
  email: string;
  name: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  role: string;
};

function encodeSession(data: SessionUser): string {
  return Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
}

function decodeSession(raw: string): SessionUser | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (!parsed?.userId || !parsed?.tenantId) return null;
    return parsed as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return decodeSession(raw);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<{ ok: true; session: SessionUser } | { ok: false; error: string }> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: {
      memberships: {
        include: { tenant: true },
        take: 1,
      },
    },
  });

  if (!user || user.memberships.length === 0) {
    return { ok: false, error: "Invalid email or password." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { ok: false, error: "Invalid email or password." };

  const membership = user.memberships[0];
  const session: SessionUser = {
    userId: user.id,
    email: user.email,
    name: user.name,
    tenantId: membership.tenantId,
    tenantSlug: membership.tenant.slug,
    tenantName: membership.tenant.name,
    role: membership.role,
  };

  const jar = await cookies();
  jar.set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // Local demo only — not production-hardened.
    secure: false,
  });

  await prisma.auditEvent.create({
    data: {
      tenantId: session.tenantId,
      userId: session.userId,
      action: "LOGIN",
      entity: "User",
      entityId: session.userId,
    },
  });

  return { ok: true, session };
}

export async function logout() {
  const session = await getSession();
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  if (session) {
    await prisma.auditEvent.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        action: "LOGOUT",
        entity: "User",
        entityId: session.userId,
      },
    });
  }
}

export function isAdmin(role: string) {
  return role === "TENANT_ADMIN";
}
