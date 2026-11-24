import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { prisma } from "./prisma";
import { forgetAcmeFoods } from "./tenant";

/** Bumped to invalidate cookies left over from DB reseed/migrate. */
export const SESSION_COOKIE = "robes_session_v2";
export const LEGACY_SESSION_COOKIES = ["robes_session"] as const;

/** Path that clears session cookies (Route Handler — required by Next.js). */
export const CLEAR_SESSION_PATH = "/auth/clear";

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

/**
 * Clear current + legacy session cookies.
 * Only call from a Route Handler or Server Action (Next.js restriction).
 */
export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  for (const name of LEGACY_SESSION_COOKIES) {
    jar.delete(name);
  }
}

async function sessionStillValid(session: SessionUser): Promise<SessionUser | null> {
  await forgetAcmeFoods(session.tenantId);
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      tenantId: session.tenantId,
    },
    include: {
      user: { select: { name: true, email: true } },
      tenant: { select: { name: true, slug: true } },
    },
  });
  if (!membership) return null;
  let name = membership.user.name;
  if (
    (membership.user.email === "admin" || membership.user.email === "admin@acmefoods.demo") &&
    name !== "Admin"
  ) {
    await prisma.user.update({
      where: { id: membership.userId },
      data: { name: "Admin" },
    });
    name = "Admin";
  }
  return {
    ...session,
    name,
    email: membership.user.email,
    role: membership.role,
    tenantName: membership.tenant.name,
    tenantSlug: membership.tenant.slug,
  };
}

/**
 * Read session without mutating cookies (safe in Server Components).
 * Stale cookies (missing user/tenant after reseed) return null.
 * Legacy cookie names are ignored so they cannot keep a dead session alive.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const decoded = decodeSession(raw);
  if (!decoded) return null;

  return sessionStillValid(decoded);
});

async function hasStaleOrLegacyCookie(): Promise<boolean> {
  const jar = await cookies();
  if (jar.get(SESSION_COOKIE)?.value) return true;
  return LEGACY_SESSION_COOKIES.some((name) => Boolean(jar.get(name)?.value));
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (session) return session;

  // Cookie present but invalid (or legacy name) → clear via Route Handler.
  if (await hasStaleOrLegacyCookie()) {
    redirect(CLEAR_SESSION_PATH);
  }
  redirect("/login");
}

/** From Server Components: bounce through the clear route (cookie delete + login). */
export function clearSessionAndRedirectToLogin(): never {
  redirect(CLEAR_SESSION_PATH);
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
    return { ok: false, error: "Invalid username or password." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { ok: false, error: "Invalid username or password." };

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

  await clearSessionCookie();
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
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  const session = raw ? decodeSession(raw) : null;

  await clearSessionCookie();

  if (session) {
    try {
      await prisma.auditEvent.create({
        data: {
          tenantId: session.tenantId,
          userId: session.userId,
          action: "LOGOUT",
          entity: "User",
          entityId: session.userId,
        },
      });
    } catch {
      // Tenant/user may already be gone after reseed — cookie is cleared either way.
    }
  }
}

export function isAdmin(role: string) {
  return role === "TENANT_ADMIN";
}
