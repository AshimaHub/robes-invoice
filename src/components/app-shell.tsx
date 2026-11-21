import Link from "next/link";
import { logout } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";

const nav = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/invoices", label: "Invoices" },
  { href: "/app/invoices/new", label: "New invoice" },
  { href: "/app/parties", label: "Parties" },
  { href: "/app/branding", label: "Branding" },
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
      className="min-h-screen"
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
      <header
        className="border-b border-black/10"
        style={{ background: "color-mix(in srgb, var(--brand-accent) 92%, black)" }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-md text-sm font-bold"
              style={{ background: "var(--brand-secondary)", color: accent }}
              aria-hidden
            >
              {session.tenantName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-white/70">
                Robes eInvoice
              </p>
              <p className="font-[family-name:var(--font-display)] text-lg leading-tight">
                {session.tenantName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-white/80 sm:inline">
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
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-white/85 hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-black/50">
        Mock NRS clearance only — not live Nigeria Revenue Service submission.
      </footer>
    </div>
  );
}
