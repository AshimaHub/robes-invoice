import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/tenant";
import { StatusBadge } from "@/components/status-badge";

export default async function CompanyInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const status = params.status?.toUpperCase();

  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId: session.tenantId,
      channel: "COMPANY",
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { party: true },
  });

  const filters = ["", "ISSUED", "DRAFT", "VOID"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
            Generate Company invoice
          </p>
          <h1 className="font-display mt-1 text-3xl text-[color:var(--brand-accent)]">
            Company invoices
          </h1>
          <p className="mt-2 max-w-xl text-sm text-black/60">
            Commercial invoices for your business — no NRS clearance on this path.
          </p>
        </div>
        <Link href="/company/invoices/new" className="btn-primary">
          New company invoice
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const href = f ? `/company/invoices?status=${f}` : "/company/invoices";
          const active = (status || "") === f;
          return (
            <Link
              key={f || "all"}
              href={href}
              className={`rounded-md px-3 py-1.5 text-sm ${
                active
                  ? "bg-[color:var(--brand-primary)] text-white"
                  : "border border-black/10 bg-white/70 text-[color:var(--brand-accent)]"
              }`}
            >
              {f || "All"}
            </Link>
          );
        })}
      </div>

      <div className="panel overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-black/50">
            <tr>
              <th className="px-4 py-3">Number</th>
              <th className="px-4 py-3">Party</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-black/50">
                  No company invoices yet. Create one to get started.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-black/5 hover:bg-white/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/company/invoices/${inv.id}`}
                      className="font-semibold text-[color:var(--brand-primary)] hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {inv.buyerName || inv.party?.name || "—"}
                  </td>
                  <td className="px-4 py-3">{formatDate(inv.issueDate)}</td>
                  <td className="px-4 py-3">
                    {formatMoney(inv.grandTotal, inv.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
