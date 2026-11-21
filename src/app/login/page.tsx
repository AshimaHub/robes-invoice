import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CLEAR_SESSION_PATH,
  getSession,
  LEGACY_SESSION_COOKIES,
  loginWithPassword,
  SESSION_COOKIE,
} from "@/lib/auth";
import { AuthMotifBackground } from "@/components/auth-motif-background";

export const instant = false;

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const result = await loginWithPassword(email, password);
  if (!result.ok) {
    redirect(`/login?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/dashboard");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  // Drop stale/legacy cookies via Route Handler before showing the form.
  const jar = await cookies();
  const stalePresent =
    Boolean(jar.get(SESSION_COOKIE)?.value) ||
    LEGACY_SESSION_COOKIES.some((name) => Boolean(jar.get(name)?.value));
  if (stalePresent) redirect(CLEAR_SESSION_PATH);

  const params = await searchParams;
  const primary = "#0B5E3C";
  const secondary = "#C4A35A";
  const accent = "#143D2B";

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 py-10 text-[#f5f0e6]"
      style={
        {
          "--brand-primary": primary,
          "--brand-secondary": secondary,
          "--brand-accent": accent,
          backgroundColor: accent,
        } as React.CSSProperties
      }
    >
      <AuthMotifBackground variant="login" />

      <div className="anim-rise relative z-10 w-full max-w-md rounded-2xl bg-[#f7f4ec] p-8 shadow-xl shadow-black/30">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">
          Robes
        </p>
        <h1 className="font-display mt-2 text-3xl text-[color:var(--brand-accent)]">
          Robes Invoice
        </h1>
        <p className="mt-2 text-sm text-black/65">
          Company invoicing and NRS-compliant e-invoice tools for your finance team.
        </p>

        {params.error ? (
          <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {params.error}
          </p>
        ) : null}

        <form action={loginAction} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue="admin@acmefoods.demo"
              className="field"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              defaultValue="demo1234"
              className="field"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn-primary w-full anim-pulse-once">
            Sign in
          </button>
        </form>

        <div className="anim-rise-delay mt-6 rounded-lg border border-black/8 bg-white/60 p-3 text-xs text-black/60">
          <p className="font-semibold text-[color:var(--brand-accent)]">
            Robes Invoice demo accounts
          </p>
          <p className="mt-1">admin@acmefoods.demo / demo1234 (Tenant Admin)</p>
          <p>issuer@acmefoods.demo / demo1234 (Issuer)</p>
          <p className="mt-2 italic">Demo tenant data only — product brand is Robes Invoice.</p>
        </div>
      </div>
    </div>
  );
}
