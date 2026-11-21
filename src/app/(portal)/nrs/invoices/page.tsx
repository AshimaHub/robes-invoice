import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { requireNrsGate } from "@/lib/nrs-gate";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/tenant";
import { StatusBadge } from "@/components/status-badge";

export default async function NrsInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireSession();
  await requireNrsGate(session.tenantId, session.userId);
  const params = await searchParams;
  const status = params.status?.toUpperCase();

  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId: session.tenantId,
      channel: "NRS",
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { party: true },
  });

  const filters = ["", "VALID", "SUBMITTED", "INVALID", "DRAFT"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
            NRS Compliant e-Invoice
          </p>
          <h1 className="font-display mt-1 text-3xl text-[color:var(--brand-accent)]">
            NRS invoice library
          </h1>
        </div>
        <Link href="/nrs/invoices/new" className="btn-primary">
          New NRS e-invoice
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const href = f ? `/nrs/invoices?status=${f}` : "/nrs/invoices";
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
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Party</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">IRN</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-black/50">
                  No NRS invoices yet.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-black/5 hover:bg-white/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/nrs/invoices/${inv.id}`}
                      className="font-semibold text-[color:var(--brand-primary)] hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{inv.documentType.replace("_", " ")}</td>
                  <td className="px-4 py-3">{inv.party?.name ?? "—"}</td>
                  <td className="px-4 py-3">{formatDate(inv.issueDate)}</td>
                  <td className="px-4 py-3">{formatMoney(inv.grandTotal)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 font-mono text-xs">
                    {inv.irn ?? "—"}
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
