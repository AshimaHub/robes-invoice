import { redirect } from "next/navigation";
import {
  AddSellerBuyer,
  InvoicePartyProvider,
  PartyNameField,
  type InvoicePartyOption,
} from "@/components/invoice-party-fields";
import { InvoiceLineItems } from "@/components/invoice-line-items";
import { requireSession } from "@/lib/auth";
import { createAndClearInvoice } from "@/lib/invoices";
import { requireNrsGate } from "@/lib/nrs-gate";
import { prisma } from "@/lib/prisma";
import { saveTenantLogo } from "@/lib/uploads";

function parseDateInput(value: FormDataEntryValue | null): Date | null {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const d = new Date(`${raw}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysInput(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function partyAddress(party: {
  addressLine1: string | null;
  city: string | null;
  state: string | null;
}) {
  return [party.addressLine1, party.city, party.state, "Nigeria"].filter(Boolean).join("\n");
}

async function rememberBuyerTin(
  tenantId: string,
  partyId: string | null,
  buyer: { name: string; email: string; address: string; tin: string },
) {
  const tin = buyer.tin.trim() || null;
  const name = buyer.name.trim();
  if (partyId) {
    const party = await prisma.party.findFirst({ where: { id: partyId, tenantId } });
    if (party) {
      await prisma.party.update({ where: { id: party.id }, data: { tin } });
      return party.id;
    }
  }
  if (!name) return null;
  const existing = await prisma.party.findFirst({ where: { tenantId, name } });
  if (existing) {
    await prisma.party.update({ where: { id: existing.id }, data: { tin } });
    return existing.id;
  }
  const created = await prisma.party.create({
    data: {
      tenantId,
      type: "CUSTOMER",
      name,
      tin,
      email: buyer.email.trim() || null,
      addressLine1: buyer.address.trim() || null,
    },
  });
  return created.id;
}

async function addPartyAction(formData: FormData): Promise<
  { ok: true; party: InvoicePartyOption } | { ok: false; error: string }
> {
  "use server";
  const session = await requireSession();
  await requireNrsGate(session.tenantId, session.userId);
  const name = String(formData.get("name") || "").trim();
  if (!name) return { ok: false, error: "Name is required." };
  const address = String(formData.get("address") || "").trim();
  const party = await prisma.party.create({
    data: {
      tenantId: session.tenantId,
      type: "CUSTOMER",
      name,
      tin: String(formData.get("tin") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      addressLine1: address || null,
    },
  });
  await prisma.auditEvent.create({
    data: {
      tenantId: session.tenantId,
      userId: session.userId,
      action: "PARTY_CREATED",
      entity: "Party",
      entityId: party.id,
      meta: JSON.stringify({ name }),
    },
  });
  return {
    ok: true,
    party: {
      id: party.id,
      type: party.type,
      name: party.name,
      tin: party.tin,
      email: party.email,
      phone: party.phone,
      address: partyAddress(party),
    },
  };
}

async function createInvoiceAction(formData: FormData) {
  "use server";
  const session = await requireSession();
  await requireNrsGate(session.tenantId, session.userId);

  const partyId = String(formData.get("partyId") || "") || null;
  const invoiceKind = String(formData.get("invoiceKind") || "B2B");
  const invoiceNumber = String(formData.get("invoiceNumber") || "").trim() || null;
  const currency = String(formData.get("currency") || "NGN").trim() || "NGN";
  const notes = String(formData.get("notes") || "");
  const paymentTerms = String(formData.get("paymentTerms") || "");
  const includeQr = formData.get("includeQr") === "on";
  const issueDate = parseDateInput(formData.get("issueDate")) ?? new Date();
  const dueDate = parseDateInput(formData.get("dueDate"));

  const seller = {
    name: String(formData.get("sellerName") || ""),
    address: String(formData.get("sellerAddress") || ""),
    phone: String(formData.get("sellerPhone") || ""),
    email: String(formData.get("sellerEmail") || ""),
    tin: String(formData.get("sellerTin") || ""),
  };
  const buyer = {
    name: String(formData.get("buyerName") || ""),
    address: String(formData.get("buyerAddress") || ""),
    phone: String(formData.get("buyerPhone") || ""),
    email: String(formData.get("buyerEmail") || ""),
    tin: String(formData.get("buyerTin") || ""),
  };
  const linkedPartyId = await rememberBuyerTin(session.tenantId, partyId, buyer);

  const descriptions = formData.getAll("description").map(String);
  const quantities = formData.getAll("quantity").map(String);
  const unitPrices = formData.getAll("unitPrice").map(String);
  const vatRates = formData.getAll("vatRate").map(String);

  const lines = descriptions
    .map((description, i) => ({
      description: description.trim(),
      quantity: Number(quantities[i] || 0),
      unitPrice: Number(unitPrices[i] || 0),
      vatRate: Number(vatRates[i] || 0),
    }))
    .filter((l) => l.description && l.quantity > 0);

  const branding = await prisma.branding.findUnique({
    where: { tenantId: session.tenantId },
  });
  let logoUrl = branding?.logoUrl ?? null;
  const logoFile = formData.get("logo");
  if (logoFile instanceof File && logoFile.size > 0) {
    try {
      logoUrl = await saveTenantLogo(session.tenantId, logoFile);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Logo upload failed";
      redirect(`/nrs/invoices/new?error=${encodeURIComponent(msg)}`);
    }
  }

  let invoiceId: string;
  try {
    const invoice = await createAndClearInvoice({
      tenantId: session.tenantId,
      userId: session.userId,
      partyId: linkedPartyId,
      invoiceKind,
      invoiceNumber,
      issueDate,
      dueDate,
      currency,
      notes,
      paymentTerms,
      seller,
      buyer,
      includeQr,
      logoUrl,
      persistBranding: true,
      lines,
    });
    invoiceId = invoice.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create invoice";
    redirect(`/nrs/invoices/new?error=${encodeURIComponent(msg)}`);
  }
  redirect(`/nrs/invoices/${invoiceId}?cleared=1`);
}

export const instant = false;

export default async function NewNrsInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession();
  await requireNrsGate(session.tenantId, session.userId);
  const params = await searchParams;
  const [parties, tenant, branding] = await Promise.all([
    prisma.party.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { name: "asc" },
    }),
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } }),
    prisma.branding.findUnique({ where: { tenantId: session.tenantId } }),
  ]);

  const partyOptions: InvoicePartyOption[] = parties.map((party) => ({
    id: party.id,
    type: party.type,
    name: party.name,
    tin: party.tin,
    email: party.email,
    phone: party.phone,
    address: partyAddress(party),
  }));
  const defaultParty = parties.find((party) => party.type === "CUSTOMER") ?? parties[0];
  const sellerName = branding?.invoiceCompanyName || tenant.legalName || tenant.name;
  const sellerAddress = [tenant.addressLine1, tenant.city, tenant.state, "Nigeria"]
    .filter(Boolean)
    .join("\n");
  const sellerEmail = branding?.invoiceEmail || "";
  const buyerAddress = defaultParty
    ? [defaultParty.addressLine1, defaultParty.city, defaultParty.state, "Nigeria"]
        .filter(Boolean)
        .join("\n")
    : "";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
          NRS Compliant e-Invoice
        </p>
        <h1 className="font-display mt-1 text-3xl text-[color:var(--brand-accent)]">
          Create NRS e-invoice
        </h1>
      </div>

      {params.error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">{params.error}</p>
      ) : null}

      <InvoicePartyProvider parties={partyOptions} addParty={addPartyAction}>
      <form action={createInvoiceAction} className="panel space-y-5 p-4 sm:p-5" encType="multipart/form-data">
        <AddSellerBuyer
          trailing={
            <label className="flex shrink-0 items-center gap-2 text-sm font-semibold text-[color:var(--brand-accent)]">
              Kind
              <select
                id="invoiceKind"
                name="invoiceKind"
                className="field w-auto py-2 text-sm"
                defaultValue="B2B"
              >
                <option value="B2B">B2B</option>
                <option value="B2C">B2C</option>
                <option value="B2G">B2G</option>
              </select>
            </label>
          }
        />
        <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-xl bg-white/45 p-3">
          <h2 className="font-display text-lg text-[color:var(--brand-accent)]">Seller</h2>
          <PartyNameField
            kind="seller"
            id="sellerName"
            name="sellerName"
            label="Name"
            required
            defaultValue={sellerName}
          />
          <div>
            <label className="label" htmlFor="sellerAddress">
              Address
            </label>
            <textarea
              id="sellerAddress"
              name="sellerAddress"
              rows={2}
              className="field"
              defaultValue={sellerAddress}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="sellerEmail">
                Email
              </label>
              <input
                id="sellerEmail"
                name="sellerEmail"
                type="email"
                className="field"
                defaultValue={sellerEmail}
              />
            </div>
            <div>
              <label className="label" htmlFor="sellerTin">
                TIN
              </label>
              <input id="sellerTin" name="sellerTin" className="field" defaultValue={tenant.tin} />
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-xl bg-white/45 p-3">
          <h2 className="font-display text-lg text-[color:var(--brand-accent)]">Buyer</h2>
          <PartyNameField
            kind="buyer"
            id="buyerName"
            name="buyerName"
            label="Name"
            required
            defaultValue={defaultParty?.name || ""}
            defaultPartyId={defaultParty?.id || ""}
          />
          <div>
            <label className="label" htmlFor="buyerAddress">
              Address
            </label>
            <textarea
              id="buyerAddress"
              name="buyerAddress"
              rows={2}
              className="field"
              defaultValue={buyerAddress}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="buyerEmail">
                Email
              </label>
              <input
                id="buyerEmail"
                name="buyerEmail"
                type="email"
                className="field"
                defaultValue={defaultParty?.email || ""}
              />
            </div>
            <div>
              <label className="label" htmlFor="buyerTin">
                TIN
              </label>
              <input
                id="buyerTin"
                name="buyerTin"
                className="field"
                defaultValue={defaultParty?.tin || ""}
              />
            </div>
          </div>
        </section>
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-lg text-[color:var(--brand-accent)]">Invoice details</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div>
              <label className="label" htmlFor="invoiceNumber">
                Invoice number
              </label>
              <input
                id="invoiceNumber"
                name="invoiceNumber"
                className="field"
                placeholder="Auto INV-#####"
              />
            </div>
            <div>
              <label className="label" htmlFor="issueDate">
                Issue date
              </label>
              <input
                id="issueDate"
                name="issueDate"
                type="date"
                className="field"
                defaultValue={todayInput()}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="dueDate">
                Due date
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                className="field"
                defaultValue={plusDaysInput(14)}
              />
            </div>
            <div>
              <label className="label" htmlFor="currency">
                Currency
              </label>
              <select id="currency" name="currency" className="field" defaultValue="NGN">
                <option value="NGN">₦ NGN</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>
        </section>

        <InvoiceLineItems />

        <section>
          <label className="label" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            className="field"
            placeholder="Enter additional note/remarks (if any - optional)"
          />
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="label" htmlFor="logo">
              Logo
            </label>
            <input
              id="logo"
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="field file:mr-3 file:rounded file:border-0 file:bg-[color:var(--brand-primary)] file:px-2 file:py-1 file:text-xs file:font-semibold file:text-white"
            />
            {branding?.logoUrl ? (
              <p className="text-xs text-black/50">Current logo stays if you leave this empty.</p>
            ) : null}
          </div>
          <label className="flex items-center gap-3 self-end rounded-lg bg-white/70 p-3 text-sm font-semibold text-[color:var(--brand-accent)]">
            <input
              type="checkbox"
              name="includeQr"
              className="h-4 w-4 accent-[color:var(--brand-primary)]"
            />
            Include QR
          </label>
        </section>

        <button type="submit" className="btn-primary">
          Create &amp; view invoice
        </button>
      </form>
      </InvoicePartyProvider>
    </div>
  );
}
