import type { Invoice, InvoiceLine } from "@prisma/client";
import { APP_LOGO } from "@/lib/brand";

export type CompanyDocumentInvoice = Invoice & {
  lines: InvoiceLine[];
};

function naira(amount: number, currency = "NGN") {
  if (currency === "NGN") {
    return `₦${amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatLongDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function multiline(text: string | null | undefined) {
  if (!text) return null;
  return text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
}

/** Standard commercial invoice letterhead — not the NRS sample layout. */
export function CompanyInvoiceDocument({
  invoice,
}: {
  invoice: CompanyDocumentInvoice;
}) {
  const sellerLines = multiline(invoice.sellerAddress);
  const buyerLines = multiline(invoice.buyerAddress);
  const money = (n: number) => naira(n, invoice.currency || "NGN");

  return (
    <article className="company-doc mx-auto w-full max-w-[860px] bg-white text-[#1a2a22] shadow-lg print:shadow-none">
      <div className="company-doc-inner p-4 sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-[#0b5e3c] pb-6">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={invoice.logoSnapshotUrl || APP_LOGO}
              alt=""
              className="h-24 w-auto max-w-[11rem] shrink-0 object-contain"
            />
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-[#143d2b] sm:text-3xl">
                {invoice.sellerName || "Company invoice"}
              </h1>
              {sellerLines?.map((line) => (
                <p key={line} className="mt-0.5 text-sm text-black/65">
                  {line}
                </p>
              ))}
              <div className="mt-2 space-y-0.5 text-sm text-black/65">
                {invoice.sellerPhone ? <p>Tel: {invoice.sellerPhone}</p> : null}
                {invoice.sellerEmail ? <p>Email: {invoice.sellerEmail}</p> : null}
                {invoice.sellerTin ? <p>TIN: {invoice.sellerTin}</p> : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 text-right">
            {invoice.includeQr && invoice.qrSvg ? (
              <div
                className="company-qr"
                dangerouslySetInnerHTML={{ __html: invoice.qrSvg }}
                title="Scan for invoice details"
              />
            ) : null}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0b5e3c]">
                Invoice
              </p>
              <p className="mt-1 font-display text-xl font-semibold text-[#143d2b]">
                {invoice.invoiceNumber}
              </p>
              <p className="mt-2 text-sm text-black/65">
                Issue date: {formatLongDate(invoice.issueDate)}
              </p>
              <p className="text-sm text-black/65">
                Due date: {formatLongDate(invoice.dueDate)}
              </p>
              <p className="text-sm text-black/65">
                Currency: {invoice.currency === "NGN" ? "₦ NGN" : invoice.currency}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0b5e3c]">
              Bill to
            </p>
            <p className="mt-2 font-semibold text-[#143d2b]">
              {invoice.buyerName || "—"}
            </p>
            {buyerLines?.map((line) => (
              <p key={line} className="text-sm text-black/65">
                {line}
              </p>
            ))}
            {invoice.buyerPhone ? (
              <p className="text-sm text-black/65">Tel: {invoice.buyerPhone}</p>
            ) : null}
            {invoice.buyerEmail ? (
              <p className="text-sm text-black/65">Email: {invoice.buyerEmail}</p>
            ) : null}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0b5e3c]">
              Status
            </p>
            <p className="mt-2 text-sm font-semibold text-[#143d2b]">{invoice.status}</p>
            {invoice.irn ? (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#0b5e3c]">
                  IRN
                </p>
                <p className="mt-1 break-all font-mono text-xs text-[#143d2b]">{invoice.irn}</p>
              </>
            ) : null}
            {invoice.paymentTerms ? (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#0b5e3c]">
                  Payment terms
                </p>
                <p className="mt-1 text-sm text-black/70">{invoice.paymentTerms}</p>
              </>
            ) : null}
          </div>
        </section>

        <section className="mt-8 overflow-x-auto">
          <table className="company-lines w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#0b5e3c]/30 bg-[#0b5e3c]/08">
                <th className="px-3 py-2.5 font-semibold text-[#143d2b]">#</th>
                <th className="px-3 py-2.5 font-semibold text-[#143d2b]">Description</th>
                <th className="px-3 py-2.5 text-right font-semibold text-[#143d2b]">Qty</th>
                <th className="px-3 py-2.5 text-right font-semibold text-[#143d2b]">
                  Unit price
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-[#143d2b]">
                  Tax / VAT
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-[#143d2b]">
                  Line total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line, i) => (
                <tr key={line.id} className="border-b border-black/8">
                  <td className="px-3 py-2.5 text-black/50" data-label="#">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2.5" data-label="Description">
                    {line.description}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums" data-label="Qty">
                    {line.quantity}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums" data-label="Unit price">
                    {money(line.unitPrice)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums" data-label="Tax / VAT">
                    {money(line.vatAmount)}
                    <span className="ml-1 text-xs text-black/45">({line.vatRate}%)</span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium" data-label="Line total">
                    {money(line.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between gap-6">
              <span className="text-black/60">Subtotal</span>
              <span className="tabular-nums">{money(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-black/60">Tax / VAT</span>
              <span className="tabular-nums">{money(invoice.vatTotal)}</span>
            </div>
            <div className="flex justify-between gap-6 border-t border-[#0b5e3c]/25 pt-2 text-base font-semibold text-[#143d2b]">
              <span>Grand total</span>
              <span className="tabular-nums">{money(invoice.grandTotal)}</span>
            </div>
          </div>
        </section>

        {invoice.notes ? (
          <section className="mt-8 border-t border-black/10 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0b5e3c]">
              Notes
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-black/70">{invoice.notes}</p>
          </section>
        ) : null}

        <footer className="mt-10 border-t border-black/8 pt-4 text-xs text-black/45">
          {invoice.irn
            ? "Demo copy. The IRN is a showcase receipt, not a live Nigeria Revenue Service submission."
            : "Commercial invoice. This is not an NRS-cleared e-invoice."}
        </footer>
      </div>
    </article>
  );
}
