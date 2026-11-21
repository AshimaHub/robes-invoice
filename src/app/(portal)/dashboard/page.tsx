import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/tenant";
import { StatusBadge } from "@/components/status-badge";
import { SimpleBarChart } from "@/components/simple-bar-chart";
import { getNrsGateStatus } from "@/lib/nrs-gate";

export const instant = false;

export default async function DashboardPage() {
  const session = await requireSession();
  const tenantId = session.tenantId;

  const [
    companyCount,
    nrsCount,
    companyIssued,
    nrsValid,
    nrsSubmitted,
    nrsInvalid,
    companyAgg,
    nrsAgg,
    recent,
    recentActivity,
    gate,
  ] = await Promise.all([
    prisma.invoice.count({ where: { tenantId, channel: "COMPANY" } }),
    prisma.invoice.count({ where: { tenantId, channel: "NRS" } }),
    prisma.invoice.count({ where: { tenantId, channel: "COMPANY", status: "ISSUED" } }),
    prisma.invoice.count({ where: { tenantId, channel: "NRS", status: "VALID" } }),
    prisma.invoice.count({ where: { tenantId, channel: "NRS", status: "SUBMITTED" } }),
    prisma.invoice.count({ where: { tenantId, channel: "NRS", status: "INVALID" } }),
    prisma.invoice.aggregate({
      where: { tenantId, channel: "COMPANY" },
      _sum: { grandTotal: true },
    }),
    prisma.invoice.aggregate({
      where: { tenantId, channel: "NRS" },
      _sum: { grandTotal: true },
    }),
    prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { party: true },
    }),
    prisma.auditEvent.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    getNrsGateStatus(tenantId, session.userId),
  ]);

  const companyTotal = companyAgg._sum.grandTotal ?? 0;
  const nrsTotal = nrsAgg._sum.grandTotal ?? 0;

  const cards = [
    { label: "Company invoices", value: String(companyCount), hint: formatMoney(companyTotal) },
    { label: "NRS e-invoices", value: String(nrsCount), hint: formatMoney(nrsTotal) },
    { label: "Company issued", value: String(companyIssued), hint: "Commercial" },
    {
      label: "NRS gate",
      value: gate.completed ? "Ready" : "Setup",
      hint: gate.completed
        ? "Prerequisites met"
        : `${gate.answeredCount}/${gate.requiredCount} required`,
    },
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
          Robes Invoice overview for {session.tenantName}. Create company invoices anytime;
          complete the NRS gate before fiscal mock clearance.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/company/invoices/new" className="btn-primary">
            Generate Company invoice
          </Link>
          <Link href={gate.completed ? "/nrs/invoices/new" : "/nrs/gate"} className="btn-secondary">
            {gate.completed ? "NRS e-Invoice" : "Continue NRS setup"}
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
            <p className="mt-1 text-xs text-black/50">{c.hint}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <SimpleBarChart
          title="Invoice counts by channel"
          emptyLabel="No invoices yet — create a company invoice to populate charts."
          items={[
            { label: "Company", value: companyCount },
            { label: "NRS", value: nrsCount },
          ]}
        />
        <SimpleBarChart
          title="NRS status breakdown"
          emptyLabel="No NRS invoices yet — finish the gate, then issue a mock-cleared e-invoice."
          items={[
            { label: "Valid (mock)", value: nrsValid, color: "#0B5E3C" },
            { label: "Submitted", value: nrsSubmitted, color: "#C4A35A" },
            { label: "Invalid", value: nrsInvalid, color: "#9f1239" },
          ]}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel anim-rise p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl text-[color:var(--brand-accent)]">
              Recent invoices
            </h2>
            <Link
              href="/company/invoices"
              className="text-sm font-semibold text-[color:var(--brand-primary)]"
            >
              Company list
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-black/55">
              No invoices yet. Start with a company invoice or complete NRS setup.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-black/8">
              {recent.map((inv) => {
                const href =
                  inv.channel === "NRS"
                    ? `/nrs/invoices/${inv.id}`
                    : `/company/invoices/${inv.id}`;
                const viewHref =
                  inv.channel === "NRS" ? `/nrs/invoices/${inv.id}/view` : href;
                return (
                  <li
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div>
                      <Link
                        href={viewHref}
                        className="font-semibold text-[color:var(--brand-accent)] hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                      <p className="text-xs text-black/55">
                        {inv.channel} · {inv.party?.name ?? "No party"} ·{" "}
                        {formatMoney(inv.grandTotal)}
                      </p>
                    </div>
                    <StatusBadge status={inv.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="panel anim-rise-delay p-5">
          <h2 className="font-display text-xl text-[color:var(--brand-accent)]">
            Recent activity
          </h2>
          {recentActivity.length === 0 ? (
            <p className="mt-4 text-sm text-black/55">Activity will appear as you use the app.</p>
          ) : (
            <ul className="mt-4 divide-y divide-black/8">
              {recentActivity.map((ev) => (
                <li key={ev.id} className="py-3 text-sm">
                  <p className="font-semibold text-[color:var(--brand-accent)]">
                    {ev.action.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-black/50">
                    {formatDate(ev.createdAt)} · {ev.entity ?? "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
