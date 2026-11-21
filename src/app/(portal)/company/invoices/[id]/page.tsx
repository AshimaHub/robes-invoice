import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/tenant";
import { StatusBadge } from "@/components/status-badge";

export default async function CompanyInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, tenantId: session.tenantId, channel: "COMPANY" },
    include: { lines: true, party: true },
  });

  if (!invoice) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
            Company invoice
          </p>
          <h1 className="font-display mt-1 text-3xl text-[color:var(--brand-accent)]">
            {invoice.invoiceNumber}
          </h1>
          <p className="mt-1 text-sm text-black/60">
            {formatDate(invoice.issueDate)} · {invoice.invoiceKind} ·{" "}
            {invoice.party?.name ?? "No party"}
          </p>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      <section className="panel overflow-x-auto p-5">
        <h2 className="font-display text-xl text-[color:var(--brand-accent)]">Lines</h2>
        <table className="mt-3 min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-black/50">
            <tr>
              <th className="py-2">Description</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Unit</th>
              <th className="py-2">VAT %</th>
              <th className="py-2">Line</th>
              <th className="py-2">VAT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.id} className="border-t border-black/5">
                <td className="py-2">{line.description}</td>
                <td className="py-2">{line.quantity}</td>
                <td className="py-2">{formatMoney(line.unitPrice)}</td>
                <td className="py-2">{line.vatRate}</td>
                <td className="py-2">{formatMoney(line.lineTotal)}</td>
                <td className="py-2">{formatMoney(line.vatAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex flex-col items-end gap-1 text-sm">
          <p>Subtotal: {formatMoney(invoice.subtotal)}</p>
          <p>VAT: {formatMoney(invoice.vatTotal)}</p>
          <p className="text-lg font-semibold text-[color:var(--brand-accent)]">
            Total: {formatMoney(invoice.grandTotal)}
          </p>
        </div>
        {invoice.notes ? (
          <p className="mt-4 text-sm text-black/60">Notes: {invoice.notes}</p>
        ) : null}
      </section>

      <Link
        href="/company/invoices"
        className="text-sm font-semibold text-[color:var(--brand-primary)]"
      >
        ← Back to company invoices
      </Link>
    </div>
  );
}
