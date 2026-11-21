import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createAndClearInvoice } from "@/lib/invoices";
import { prisma } from "@/lib/prisma";

async function createInvoiceAction(formData: FormData) {
  "use server";
  const session = await requireSession();
  const partyId = String(formData.get("partyId") || "") || null;
  const invoiceKind = String(formData.get("invoiceKind") || "B2B");
  const notes = String(formData.get("notes") || "");

  const descriptions = formData.getAll("description").map(String);
  const quantities = formData.getAll("quantity").map(String);
  const unitPrices = formData.getAll("unitPrice").map(String);
  const vatRates = formData.getAll("vatRate").map(String);

  const lines = descriptions
    .map((description, i) => ({
      description: description.trim(),
      quantity: Number(quantities[i] || 0),
      unitPrice: Number(unitPrices[i] || 0),
      vatRate: Number(vatRates[i] || 7.5),
    }))
    .filter((l) => l.description && l.quantity > 0);

  let invoiceId: string;
  try {
    const invoice = await createAndClearInvoice({
      tenantId: session.tenantId,
      userId: session.userId,
      partyId,
      invoiceKind,
      notes,
      lines,
    });
    invoiceId = invoice.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create invoice";
    redirect(`/app/invoices/new?error=${encodeURIComponent(msg)}`);
  }
  redirect(`/app/invoices/${invoiceId}?cleared=1`);
}

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const parties = await prisma.party.findMany({
    where: { tenantId: session.tenantId, type: "CUSTOMER" },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
          Issue
        </p>
        <h1 className="font-display mt-1 text-3xl text-[color:var(--brand-accent)]">
          Create invoice
        </h1>
        <p className="mt-2 text-sm text-black/60">
          Submits through MockNrsAdapter and returns a demo IRN + QR. Not live NRS.
        </p>
      </div>

      {params.error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {params.error}
        </p>
      ) : null}

      <form action={createInvoiceAction} className="panel space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="partyId">
              Customer
            </label>
            <select id="partyId" name="partyId" className="field" defaultValue={parties[0]?.id}>
              <option value="">— No party —</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.tin ? `(${p.tin})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="invoiceKind">
              Invoice kind
            </label>
            <select id="invoiceKind" name="invoiceKind" className="field" defaultValue="B2B">
              <option value="B2B">B2B</option>
              <option value="B2C">B2C</option>
              <option value="B2G">B2G</option>
            </select>
          </div>
        </div>

        <div>
          <p className="label">Line items</p>
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="grid gap-2 rounded-lg bg-white/70 p-3 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <input
                    name="description"
                    className="field"
                    placeholder="Description"
                    defaultValue={i === 0 ? "Palm oil 25L" : ""}
                    required={i === 0}
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    name="quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    className="field"
                    placeholder="Qty"
                    defaultValue={i === 0 ? "10" : ""}
                    required={i === 0}
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    name="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    className="field"
                    placeholder="Unit price"
                    defaultValue={i === 0 ? "18500" : ""}
                    required={i === 0}
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    name="vatRate"
                    type="number"
                    min="0"
                    step="0.1"
                    className="field"
                    placeholder="VAT %"
                    defaultValue="7.5"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="notes">
            Notes
          </label>
          <textarea id="notes" name="notes" rows={2} className="field" placeholder="Optional" />
        </div>

        <button type="submit" className="btn-primary">
          Issue &amp; mock-clear
        </button>
      </form>
    </div>
  );
}
