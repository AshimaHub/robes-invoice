import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { requireNrsGate } from "@/lib/nrs-gate";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/tenant";
import { StatusBadge } from "@/components/status-badge";

export const instant = false;

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
              <th className="px-2 py-3 sm:px-4">Number</th>
              <th className="hidden px-4 py-3 sm:table-cell">Type</th>
              <th className="px-2 py-3 sm:px-4">Party</th>
              <th className="hidden px-4 py-3 md:table-cell">Date</th>
              <th className="px-2 py-3 sm:px-4">Total</th>
              <th className="px-2 py-3 sm:px-4">Status</th>
              <th className="hidden px-4 py-3 lg:table-cell">IRN</th>
              <th className="px-2 py-3 sm:px-4">View</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-black/50">
                  No NRS invoices yet.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-black/5 hover:bg-white/40">
                  <td className="px-2 py-3 sm:px-4">
                    <Link
                      href={`/nrs/invoices/${inv.id}`}
                      className="font-semibold text-[color:var(--brand-primary)] hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">{inv.documentType.replace("_", " ")}</td>
                  <td className="px-2 py-3 sm:px-4">{inv.party?.name ?? "—"}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{formatDate(inv.issueDate)}</td>
                  <td className="px-2 py-3 sm:px-4">{formatMoney(inv.grandTotal)}</td>
                  <td className="px-2 py-3 sm:px-4">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="hidden max-w-[220px] truncate px-4 py-3 font-mono text-xs lg:table-cell">
                    {inv.irn ?? "—"}
                  </td>
                  <td className="px-2 py-3 sm:px-4">
                    <Link
                      href={`/nrs/invoices/${inv.id}/view`}
                      className="font-semibold text-[color:var(--brand-primary)] hover:underline"
                    >
                      {inv.status === "VALID" ? "View e-Invoice" : "View"}
                    </Link>
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
