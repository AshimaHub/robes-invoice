import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/tenant";
import { StatusBadge } from "@/components/status-badge";

export default async function DashboardPage() {
  const session = await requireSession();
  const tenantId = session.tenantId;

  const [drafts, submitted, valid, invalid, recent, tenant] = await Promise.all([
    prisma.invoice.count({ where: { tenantId, status: "DRAFT" } }),
    prisma.invoice.count({ where: { tenantId, status: "SUBMITTED" } }),
    prisma.invoice.count({ where: { tenantId, status: "VALID" } }),
    prisma.invoice.count({ where: { tenantId, status: "INVALID" } }),
    prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { party: true },
    }),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
  ]);

  const cards = [
    { label: "Drafts", value: drafts },
    { label: "Submitted", value: submitted },
    { label: "Valid (mock)", value: valid },
    { label: "Invalid", value: invalid },
  ];

  return (
    <div className="space-y-8">
      <section className="anim-rise">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
          Dashboard
        </p>
        <h1 className="font-display mt-1 text-3xl text-[color:var(--brand-accent)]">
          Welcome, {session.name.split(" ")[0]}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-black/65">
          {tenant.legalName} · TIN {tenant.tin} · Service ID {tenant.serviceId} ·{" "}
          {tenant.nrsEnv} (mock adapter)
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/app/invoices/new" className="btn-primary">
            Create invoice
          </Link>
          <Link href="/app/invoices" className="btn-secondary">
            View invoice library
          </Link>
        </div>
      </section>

      <section className="anim-rise-delay grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="panel px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-black/50">{c.label}</p>
            <p className="font-display mt-1 text-3xl text-[color:var(--brand-accent)]">
              {c.value}
            </p>
          </div>
        ))}
      </section>

      <section className="panel anim-rise p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl text-[color:var(--brand-accent)]">
            Recent invoices
          </h2>
          <Link href="/app/invoices" className="text-sm font-semibold text-[color:var(--brand-primary)]">
            See all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-black/55">
            No invoices yet. Create one to see mock IRN + QR clearance.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-black/8">
            {recent.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <Link
                    href={`/app/invoices/${inv.id}`}
                    className="font-semibold text-[color:var(--brand-accent)] hover:underline"
                  >
                    {inv.invoiceNumber}
                  </Link>
                  <p className="text-xs text-black/55">
                    {inv.documentType.replace("_", " ")} · {inv.party?.name ?? "No party"} ·{" "}
                    {formatMoney(inv.grandTotal)}
                  </p>
                </div>
                <StatusBadge status={inv.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
