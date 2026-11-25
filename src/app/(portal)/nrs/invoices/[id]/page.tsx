import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { SubmitButton } from "@/components/submit-button";
import { requireSession } from "@/lib/auth";
import { createAndClearInvoice } from "@/lib/invoices";
import { requireNrsGate } from "@/lib/nrs-gate";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/tenant";
import { StatusBadge } from "@/components/status-badge";

async function creditNoteAction(formData: FormData) {
  "use server";
  const session = await requireSession();
  await requireNrsGate(session.tenantId, session.userId);
  const relatedInvoiceId = String(formData.get("relatedInvoiceId") || "");
  const amount = Number(formData.get("amount") || 0);
  const reason = String(formData.get("reason") || "Credit note");

  const original = await prisma.invoice.findFirst({
    where: { id: relatedInvoiceId, tenantId: session.tenantId, channel: "NRS" },
  });
  if (!original) redirect("/nrs/invoices");

  let noteId: string;
  try {
    const note = await createAndClearInvoice({
      tenantId: session.tenantId,
      userId: session.userId,
      partyId: original.partyId,
      invoiceKind: original.invoiceKind,
      documentType: "CREDIT_NOTE",
      relatedInvoiceId: original.id,
      notes: reason,
      lines: [
        {
          description: reason || `Credit against ${original.invoiceNumber}`,
          quantity: 1,
          unitPrice: amount > 0 ? amount : original.subtotal,
          vatRate: original.subtotal
            ? Number(((original.vatTotal / original.subtotal) * 100).toFixed(2))
            : 7.5,
        },
      ],
    });
    noteId = note.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Credit note failed";
    redirect(`/nrs/invoices/${relatedInvoiceId}?error=${encodeURIComponent(msg)}`);
  }
  redirect(`/nrs/invoices/${noteId}?cleared=1`);
}

export const instant = false;

export default async function NrsInvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cleared?: string; error?: string }>;
}) {
  const session = await requireSession();
  await requireNrsGate(session.tenantId, session.userId);
  const { id } = await params;
  const sp = await searchParams;

  const invoice = await prisma.invoice.findFirst({
    where: { id, tenantId: session.tenantId, channel: "NRS" },
    include: {
      lines: true,
      party: true,
      events: { orderBy: { createdAt: "asc" } },
      relatedInvoice: true,
      adjustments: true,
    },
  });

  if (!invoice) notFound();

  return (
    <div className="space-y-6">
      <BackLink href="/nrs/invoices" label="Back to NRS invoices" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
            NRS · {invoice.documentType.replace("_", " ")}
          </p>
          <h1 className="font-display mt-1 text-3xl text-[color:var(--brand-accent)]">
            {invoice.invoiceNumber}
          </h1>
          <p className="mt-1 text-sm text-black/60">
            {formatDate(invoice.issueDate)} · {invoice.invoiceKind} ·{" "}
            {invoice.party?.name ?? "No party"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={invoice.status} />
          <Link href={`/nrs/invoices/${invoice.id}/view`} className="btn-primary">
            View e-Invoice
          </Link>
        </div>
      </div>

      {sp.cleared ? (
        <p className="anim-pulse-once rounded-md bg-[#F6E8E9] px-3 py-2 text-sm text-[#111111]">
          Mock clearance succeeded. IRN and QR are ready below.
        </p>
      ) : null}
      {sp.error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">{sp.error}</p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="panel anim-rise space-y-3 p-5 lg:col-span-2">
          <h2 className="font-display text-xl text-[color:var(--brand-accent)]">Clearance</h2>
          {invoice.irn ? (
            <div>
              <p className="label">IRN</p>
              <p className="break-all rounded-md bg-white/80 px-3 py-2 font-mono text-sm">
                {invoice.irn}
              </p>
            </div>
          ) : (
            <p className="text-sm text-black/55">No IRN yet.</p>
          )}
          <p className="text-sm text-black/65">{invoice.validationMsg}</p>
          {invoice.relatedInvoice ? (
            <p className="text-sm">
              Related to{" "}
              <Link
                href={`/nrs/invoices/${invoice.relatedInvoice.id}`}
                className="font-semibold text-[color:var(--brand-primary)] hover:underline"
              >
                {invoice.relatedInvoice.invoiceNumber}
              </Link>
            </p>
          ) : null}

          <div>
            <p className="label">Status timeline</p>
            <ol className="mt-2 space-y-2 border-l-2 border-[color:var(--brand-secondary)] pl-4">
              {invoice.events.map((ev) => (
                <li key={ev.id} className="text-sm">
                  <span className="font-semibold">{ev.status}</span>
                  <span className="text-black/50">
                    {" "}
                    · {formatDate(ev.createdAt)} {new Date(ev.createdAt).toLocaleTimeString()}
                  </span>
                  {ev.message ? <p className="text-black/60">{ev.message}</p> : null}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="panel anim-rise-delay flex flex-col items-center justify-center gap-3 p-5 text-center">
          <h2 className="font-display text-xl text-[color:var(--brand-accent)]">QR / CSID</h2>
          {invoice.qrSvg ? (
            <div
              className="rounded-lg bg-white p-3"
              dangerouslySetInnerHTML={{ __html: invoice.qrSvg }}
            />
          ) : (
            <p className="text-sm text-black/50">QR appears after successful clearance.</p>
          )}
          <p className="text-xs text-black/45">Mock sandbox QR — not fiscal until live NRS.</p>
        </section>
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
      </section>

      {invoice.documentType === "INVOICE" && invoice.status === "VALID" ? (
        <section className="panel p-5">
          <h2 className="font-display text-xl text-[color:var(--brand-accent)]">Credit note</h2>
          <p className="mt-1 text-sm text-black/60">
            Issue a credit note against this cleared invoice (mock clearance).
          </p>
          <form action={creditNoteAction} className="mt-4 grid gap-3 sm:grid-cols-3">
            <input type="hidden" name="relatedInvoiceId" value={invoice.id} />
            <div>
              <label className="label" htmlFor="amount">
                Credit amount (ex-VAT)
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                className="field"
                defaultValue={invoice.subtotal}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="reason">
                Reason
              </label>
              <input
                id="reason"
                name="reason"
                className="field"
                defaultValue={`Credit against ${invoice.invoiceNumber}`}
              />
            </div>
            <SubmitButton pendingLabel="Issuing credit note…" className="btn-secondary sm:col-span-3 sm:w-fit">
              Issue credit note
            </SubmitButton>
          </form>
          {invoice.adjustments.length > 0 ? (
            <ul className="mt-4 text-sm">
              {invoice.adjustments.map((adj) => (
                <li key={adj.id}>
                  <Link
                    href={`/nrs/invoices/${adj.id}`}
                    className="font-semibold text-[color:var(--brand-primary)] hover:underline"
                  >
                    {adj.invoiceNumber}
                  </Link>{" "}
                  · {adj.documentType} · <StatusBadge status={adj.status} />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <Link href="/nrs/invoices" className="text-sm font-semibold text-[color:var(--brand-primary)]">
        ← Back to NRS invoices
      </Link>
    </div>
  );
}
