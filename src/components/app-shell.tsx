import Link from "next/link";
import { logout } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { AuthMotifBackground } from "@/components/auth-motif-background";

const primaryNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/nrs/gate", label: "NRS Compliant e-Invoice" },
];

export function AppShell({
  session,
  branding,
  children,
}: {
  session: SessionUser;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl?: string | null;
  } | null;
  children: React.ReactNode;
}) {
  const primary = branding?.primaryColor ?? "#0B5E3C";
  const secondary = branding?.secondaryColor ?? "#C4A35A";
  const accent = branding?.accentColor ?? "#143D2B";

  return (
    <div
      className="relative min-h-screen"
      style={
        {
          "--brand-primary": primary,
          "--brand-secondary": secondary,
          "--brand-accent": accent,
          background:
            "radial-gradient(1200px 500px at 10% -10%, color-mix(in srgb, var(--brand-secondary) 28%, transparent), transparent), linear-gradient(165deg, #f7f4ec 0%, #eef3ef 45%, #e8efe9 100%)",
        } as React.CSSProperties
      }
    >
      <AuthMotifBackground variant="app" />
      <header
        className="relative z-10 border-b border-black/10 print:hidden"
        style={{ background: "color-mix(in srgb, var(--brand-accent) 92%, black)" }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-md text-sm font-bold"
              style={{ background: "var(--brand-secondary)", color: accent }}
              aria-hidden
            >
              RI
            </div>
            <div>
              <p className="font-[family-name:var(--font-display)] text-lg leading-tight">
                Robes Invoice
              </p>
              <p className="text-xs text-white">
                Robes · {session.tenantName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-sm text-white">
              {session.name} · {session.role.replace("_", " ")}
            </span>
            <form
              action={async () => {
                "use server";
                await logout();
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-white hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="relative z-10 mx-auto max-w-6xl px-4 pb-8 text-xs text-black/50 print:hidden">
        Robes Invoice — company invoicing plus optional NRS mock clearance (not live Nigeria
        Revenue Service submission).
      </footer>
    </div>
  );
}
