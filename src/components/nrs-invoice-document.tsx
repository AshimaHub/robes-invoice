import type { Invoice, InvoiceLine, Party, Tenant } from "@prisma/client";

export type NrsDocumentInvoice = Invoice & {
  lines: InvoiceLine[];
  party: Party | null;
};

function naira(amount: number) {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatIssueDateTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const formatted = date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Africa/Lagos",
  });
  return `${formatted} (WAT)`;
}

function invoiceTypeLabel(documentType: string, invoiceKind: string) {
  if (documentType === "CREDIT_NOTE") return "Credit Note";
  if (documentType === "DEBIT_NOTE") return "Debit Note";
  if (invoiceKind === "B2C") return "Tax Invoice (VAT) · B2C";
  if (invoiceKind === "B2G") return "Tax Invoice (VAT) · B2G";
  return "Tax Invoice (VAT)";
}

function verificationCode(irn: string | null, invoiceNumber: string) {
  if (!irn) return `MOCK-${invoiceNumber}`;
  const compact = irn.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const chunk = (compact.slice(0, 16) || "MOCKREFCODE0001").padEnd(16, "0");
  return `NRS-EINV-${chunk}`;
}

function sellerAddress(tenant: Tenant) {
  return [tenant.addressLine1, tenant.city, tenant.state, "Nigeria"]
    .filter(Boolean)
    .join(", ");
}

function buyerAddress(party: Party | null) {
  if (!party) return "—";
  return [party.addressLine1, party.city, party.state, "Nigeria"]
    .filter(Boolean)
    .join(", ");
}

export function NrsInvoiceDocument({
  invoice,
  tenant,
}: {
  invoice: NrsDocumentInvoice;
  tenant: Tenant;
}) {
  const isValid = invoice.status === "VALID";
  const statusLabel = isValid ? "VALID" : invoice.status;
  const refCode = verificationCode(invoice.irn, invoice.invoiceNumber);
  const vatRate =
    invoice.lines[0]?.vatRate ??
    (invoice.subtotal > 0
      ? Number(((invoice.vatTotal / invoice.subtotal) * 100).toFixed(1))
      : 7.5);

  return (
    <article className="nrs-doc mx-auto w-full max-w-[900px] bg-white text-[#1a1a1a] shadow-lg print:shadow-none">
      <div className="nrs-doc-inner p-6 sm:p-8">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e5e7eb] pb-5">
          <div className="flex items-center gap-3">
            <div className="nrs-logo" aria-hidden>
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <circle cx="22" cy="22" r="21" fill="#E8F5E9" stroke="#006837" strokeWidth="1.5" />
                <path
                  d="M10 28c4-10 8-14 12-14s8 4 12 14"
                  stroke="#F9A825"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M12 24c3.5-7 7-10 10-10s6.5 3 10 10"
                  stroke="#006837"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tight text-[#006837]">NRS</span>
                <span className="h-6 w-px bg-[#cbd5e1]" aria-hidden />
                <span className="text-sm font-medium text-[#111827]">
                  Nigeria Revenue Service
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-[#111827]">
              Electronic Tax Invoice (e-Invoice)
            </p>
            <p className="mt-0.5 max-w-[260px] text-xs text-[#6b7280]">
              Issued under the Nigeria Revenue Service (NRS) e-Invoicing System
            </p>
          </div>
        </header>

        {/* Banner */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#006837] px-4 py-3 text-white">
          <p className="text-lg font-bold tracking-wide sm:text-xl">NRS e-Invoice</p>
          {isValid ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-bold text-[#006837]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#006837] text-[10px] text-white">
                ✓
              </span>
              VALID
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
              {statusLabel}
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <dl className="space-y-1.5 text-sm">
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-bold">Invoice No.:</dt>
              <dd className="font-mono text-[13px]">{invoice.invoiceNumber}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-bold">Issue Date:</dt>
              <dd>{formatIssueDateTime(invoice.issueDate)}</dd>
            </div>
          </dl>
          <dl className="space-y-1.5 text-sm sm:text-right">
            <div className="flex flex-wrap gap-x-2 sm:justify-end">
              <dt className="font-bold">Status:</dt>
              <dd className={isValid ? "font-bold text-[#006837]" : "font-semibold"}>
                {statusLabel}
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-2 sm:justify-end">
              <dt className="font-bold">Invoice Type:</dt>
              <dd>{invoiceTypeLabel(invoice.documentType, invoice.invoiceKind)}</dd>
            </div>
          </dl>
        </div>

        {/* Seller / Buyer */}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <section className="rounded-lg bg-[#f3f4f6] p-4 text-sm">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#6b7280]">
              Seller (Supplier)
            </h2>
            <p className="font-bold text-[#111827]">{tenant.legalName || tenant.name}</p>
            <p className="mt-1 text-[#4b5563]">{sellerAddress(tenant)}</p>
            <dl className="mt-3 space-y-1 text-[13px]">
              <div>
                <dt className="inline font-semibold">Tax Identification No. (TIN): </dt>
                <dd className="inline">{tenant.tin}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">VAT Registration No.: </dt>
                <dd className="inline">{tenant.tin}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Business ID: </dt>
                <dd className="inline">{tenant.businessId ?? "—"}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Service ID: </dt>
                <dd className="inline">{tenant.serviceId}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg bg-[#f3f4f6] p-4 text-sm">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#6b7280]">
              Buyer (Customer)
            </h2>
            <p className="font-bold text-[#111827]">{invoice.party?.name ?? "Walk-in / Unspecified"}</p>
            <p className="mt-1 text-[#4b5563]">{buyerAddress(invoice.party)}</p>
            <dl className="mt-3 space-y-1 text-[13px]">
              <div>
                <dt className="inline font-semibold">Tax Identification No. (TIN): </dt>
                <dd className="inline">{invoice.party?.tin ?? "—"}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">VAT Registration No.: </dt>
                <dd className="inline">{invoice.party?.tin ?? "—"}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Email: </dt>
                <dd className="inline">{invoice.party?.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Phone: </dt>
                <dd className="inline">{invoice.party?.phone ?? "—"}</dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Lines */}
        <div className="mt-6 overflow-x-auto">
          <table className="nrs-lines w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#006837] text-left text-white">
                <th className="px-3 py-2.5 font-semibold">S/N</th>
                <th className="px-3 py-2.5 font-semibold">Description of Goods / Services</th>
                <th className="px-3 py-2.5 text-right font-semibold">Qty</th>
                <th className="px-3 py-2.5 text-right font-semibold">Unit Price (₦)</th>
                <th className="px-3 py-2.5 text-right font-semibold">VAT ({vatRate}%) (₦)</th>
                <th className="px-3 py-2.5 text-right font-semibold">Subtotal (₦)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line, idx) => (
                <tr key={line.id} className="border-b border-[#e5e7eb]">
                  <td className="px-3 py-2.5">{idx + 1}</td>
                  <td className="px-3 py-2.5">{line.description}</td>
                  <td className="px-3 py-2.5 text-right">{line.quantity}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {line.unitPrice.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {line.vatAmount.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium">
                    {(line.lineTotal + line.vatAmount).toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex items-center justify-between rounded border border-[#e5e7eb] px-3 py-2">
              <dt>Subtotal (Excl. VAT)</dt>
              <dd className="font-medium tabular-nums">{naira(invoice.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between rounded border border-[#e5e7eb] px-3 py-2">
              <dt>VAT ({vatRate}%)</dt>
              <dd className="font-medium tabular-nums">{naira(invoice.vatTotal)}</dd>
            </div>
            <div className="flex items-center justify-between rounded border border-[#006837]/25 bg-[#E8F5E9] px-3 py-2.5">
              <dt className="font-bold">Grand Total (Incl. VAT)</dt>
              <dd className="text-base font-bold tabular-nums text-[#006837]">
                {naira(invoice.grandTotal)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Payment + QR */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <section className="overflow-hidden rounded-lg border border-[#c8e6c9]">
            <div className="bg-[#E8F5E9] px-4 py-2 text-sm font-bold text-[#006837]">
              Payment Information
            </div>
            <div className="space-y-2 px-4 py-3 text-sm">
              <p>
                <span className="font-semibold">Payment Status: </span>
                {isValid ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5E9] px-2 py-0.5 text-xs font-bold text-[#006837]">
                    <span aria-hidden>✓</span> Paid
                  </span>
                ) : (
                  <span className="text-[#6b7280]">Pending</span>
                )}
              </p>
              <p>
                <span className="font-semibold">Payment Method: </span>
                Bank Transfer (demo)
              </p>
              <p>
                <span className="font-semibold">Transaction Reference: </span>
                <span className="font-mono text-xs">
                  {invoice.irn ? `TXN-${invoice.invoiceNumber}` : "—"}
                </span>
              </p>
              <p>
                <span className="font-semibold">Payment Date: </span>
                {invoice.mockClearanceAt
                  ? formatIssueDateTime(invoice.mockClearanceAt)
                  : isValid
                    ? formatIssueDateTime(invoice.issueDate)
                    : "—"}
              </p>
            </div>
          </section>

          <section className="flex flex-wrap items-center gap-4 rounded-lg border border-[#e5e7eb] p-4">
            {invoice.qrSvg ? (
              <div
                className="nrs-qr shrink-0 rounded bg-white p-1"
                dangerouslySetInnerHTML={{ __html: invoice.qrSvg }}
              />
            ) : (
              <div className="flex h-[120px] w-[120px] items-center justify-center rounded border border-dashed border-[#cbd5e1] text-center text-xs text-[#9ca3af]">
                QR after clearance
              </div>
            )}
            <p className="max-w-[200px] text-sm text-[#4b5563]">
              Scan to verify this invoice on the NRS e-Invoice platform.
              <span className="mt-1 block text-xs italic text-[#9ca3af]">
                Mock / demo QR — not live NRS verification.
              </span>
            </p>
          </section>
        </div>

        {/* Verification bar */}
        <div className="mt-5 rounded-lg bg-[#E8F5E9] px-4 py-3">
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#006837] text-xs text-white">
              ✓
            </span>
            <span className="font-bold text-[#111827]">Verification / Reference Code: </span>
            <span className="font-mono font-bold text-[#006837]">{refCode}</span>
          </p>
          {invoice.irn ? (
            <p className="mt-1 pl-8 font-mono text-xs text-[#4b5563]">IRN: {invoice.irn}</p>
          ) : null}
          <p className="mt-1 pl-8 text-xs text-[#6b7280]">
            Verify this invoice at https://e-invoice.nrs.gov.ng/verify using the reference code
            or by scanning the QR code.{" "}
            <em className="text-[#9ca3af]">
              (Illustrative link — Robes Invoice mock clearance only.)
            </em>
          </p>
        </div>

        {/* Fine print */}
        <footer className="relative mt-6 border-t border-[#e5e7eb] pt-4 text-center text-xs text-[#6b7280]">
          <p>This is a computer-generated e-invoice and is valid without a physical signature.</p>
          <p className="mt-1 font-medium text-[#b45309]">
            Sample / Illustrative — Robes Invoice demo mock. Not a live Nigeria Revenue Service
            fiscal document.
          </p>
          <span
            className="pointer-events-none absolute bottom-0 right-0 select-none text-[11px] font-medium uppercase tracking-wider text-[#d1d5db]"
            aria-hidden
          >
            Sample / Illustrative
          </span>
        </footer>
      </div>
    </article>
  );
}
