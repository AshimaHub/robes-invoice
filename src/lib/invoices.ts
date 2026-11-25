import QRCode from "qrcode";
import { prisma } from "./prisma";
import { getNrsAdapter } from "./nrs/mock-adapter";

export type LineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  hsnCode?: string;
};

export type CompanySellerInput = {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  tin?: string;
};

export type CompanyBuyerInput = {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
};

function computeLines(lines: LineInput[]) {
  return lines.map((l) => {
    const vatRate = l.vatRate ?? 7.5;
    const lineTotal = Number((l.quantity * l.unitPrice).toFixed(2));
    const vatAmount = Number(((lineTotal * vatRate) / 100).toFixed(2));
    return {
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      vatRate,
      lineTotal,
      vatAmount,
      hsnCode: l.hsnCode || null,
    };
  });
}

async function nextInvoiceNumber(tenantId: string, prefix: string) {
  const count = await prisma.invoice.count({ where: { tenantId } });
  const seq = String(count + 1).padStart(5, "0");
  return `${prefix}-${seq}`;
}

function buildCompanyQrPayload(data: {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date | null;
  currency: string;
  sellerName: string;
  sellerTin: string | null;
  buyerName: string;
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  lines: { description: string; quantity: number; unitPrice: number; lineTotal: number; vatAmount: number }[];
}) {
  return JSON.stringify({
    type: "robes.company_invoice",
    version: 1,
    invoiceNumber: data.invoiceNumber,
    issueDate: data.issueDate.toISOString().slice(0, 10),
    dueDate: data.dueDate ? data.dueDate.toISOString().slice(0, 10) : null,
    currency: data.currency,
    seller: { name: data.sellerName, tin: data.sellerTin },
    buyer: { name: data.buyerName },
    totals: {
      subtotal: data.subtotal,
      tax: data.vatTotal,
      grandTotal: data.grandTotal,
    },
    lines: data.lines.map((l) => ({
      description: l.description,
      qty: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
      tax: l.vatAmount,
    })),
  });
}

/** Commercial company invoice — no NRS mock clearance. */
export async function createCompanyInvoice(opts: {
  tenantId: string;
  userId: string;
  partyId?: string | null;
  invoiceKind?: string;
  invoiceNumber?: string | null;
  issueDate?: Date;
  dueDate?: Date | null;
  currency?: string;
  notes?: string | null;
  paymentTerms?: string | null;
  seller: CompanySellerInput;
  buyer: CompanyBuyerInput;
  includeQr?: boolean;
  logoUrl?: string | null;
  persistBranding?: boolean;
  lines: LineInput[];
}) {
  const computed = computeLines(opts.lines);
  if (computed.length === 0) throw new Error("Add at least one line item.");
  if (!opts.seller.name.trim()) throw new Error("Seller company name is required.");
  if (!opts.buyer.name.trim()) throw new Error("Buyer name is required.");

  const subtotal = Number(computed.reduce((s, l) => s + l.lineTotal, 0).toFixed(2));
  const vatTotal = Number(computed.reduce((s, l) => s + l.vatAmount, 0).toFixed(2));
  const grandTotal = Number((subtotal + vatTotal).toFixed(2));
  const invoiceNumber =
    opts.invoiceNumber?.trim() || (await nextInvoiceNumber(opts.tenantId, "CI"));
  const issueDate = opts.issueDate ?? new Date();
  const dueDate = opts.dueDate ?? null;
  const currency = opts.currency?.trim() || "NGN";
  const includeQr = Boolean(opts.includeQr);
  const logoSnapshotUrl = opts.logoUrl || null;

  const party = opts.partyId
    ? await prisma.party.findFirst({
        where: { id: opts.partyId, tenantId: opts.tenantId },
      })
    : null;

  let qrPayload: string | null = null;
  let qrSvg: string | null = null;
  if (includeQr) {
    qrPayload = buildCompanyQrPayload({
      invoiceNumber,
      issueDate,
      dueDate,
      currency,
      sellerName: opts.seller.name.trim(),
      sellerTin: opts.seller.tin?.trim() || null,
      buyerName: opts.buyer.name.trim(),
      subtotal,
      vatTotal,
      grandTotal,
      lines: computed,
    });
    qrSvg = await QRCode.toString(qrPayload, {
      type: "svg",
      margin: 1,
      width: 160,
      color: { dark: "#111111", light: "#FFFFFF" },
    });
  }

  if (opts.persistBranding) {
    await prisma.branding.upsert({
      where: { tenantId: opts.tenantId },
      create: {
        tenantId: opts.tenantId,
        invoiceCompanyName: opts.seller.name.trim(),
        invoicePhone: opts.seller.phone?.trim() || null,
        invoiceEmail: opts.seller.email?.trim() || null,
        logoUrl: logoSnapshotUrl,
      },
      update: {
        invoiceCompanyName: opts.seller.name.trim(),
        invoicePhone: opts.seller.phone?.trim() || null,
        invoiceEmail: opts.seller.email?.trim() || null,
        ...(logoSnapshotUrl ? { logoUrl: logoSnapshotUrl } : {}),
      },
    });
  }

  const invoice = await prisma.invoice.create({
    data: {
      tenantId: opts.tenantId,
      partyId: party?.id ?? null,
      channel: "COMPANY",
      documentType: "INVOICE",
      invoiceKind: opts.invoiceKind ?? "B2B",
      invoiceNumber,
      issueDate,
      dueDate,
      currency,
      status: "ISSUED",
      notes: opts.notes?.trim() || null,
      paymentTerms: opts.paymentTerms?.trim() || null,
      sellerName: opts.seller.name.trim(),
      sellerAddress: opts.seller.address?.trim() || null,
      sellerPhone: opts.seller.phone?.trim() || null,
      sellerEmail: opts.seller.email?.trim() || null,
      sellerTin: opts.seller.tin?.trim() || null,
      buyerName: opts.buyer.name.trim(),
      buyerAddress: opts.buyer.address?.trim() || null,
      buyerEmail: opts.buyer.email?.trim() || null,
      buyerPhone: opts.buyer.phone?.trim() || null,
      includeQr,
      logoSnapshotUrl,
      qrPayload,
      qrSvg,
      subtotal,
      vatTotal,
      grandTotal,
      lines: { create: computed },
    },
    include: { lines: true, party: true },
  });

  await prisma.auditEvent.create({
    data: {
      tenantId: opts.tenantId,
      userId: opts.userId,
      action: "COMPANY_INVOICE_CREATED",
      entity: "Invoice",
      entityId: invoice.id,
      meta: JSON.stringify({ invoiceNumber, grandTotal, includeQr }),
    },
  });

  return invoice;
}

/** NRS channel invoice with mock clearance (IRN + QR). */
export async function createAndClearInvoice(opts: {
  tenantId: string;
  userId: string;
  partyId?: string | null;
  invoiceKind?: string;
  documentType?: string;
  invoiceNumber?: string | null;
  issueDate?: Date;
  dueDate?: Date | null;
  currency?: string;
  notes?: string;
  paymentTerms?: string | null;
  seller?: CompanySellerInput;
  buyer?: CompanyBuyerInput;
  includeQr?: boolean;
  logoUrl?: string | null;
  persistBranding?: boolean;
  relatedInvoiceId?: string | null;
  lines: LineInput[];
}) {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: opts.tenantId },
  });

  const documentType = opts.documentType ?? "INVOICE";
  const prefix =
    documentType === "CREDIT_NOTE"
      ? "CN"
      : documentType === "DEBIT_NOTE"
        ? "DN"
        : "INV";

  let relatedIrn: string | null = null;
  if (opts.relatedInvoiceId) {
    const related = await prisma.invoice.findFirst({
      where: {
        id: opts.relatedInvoiceId,
        tenantId: opts.tenantId,
        channel: "NRS",
      },
    });
    if (!related || related.status !== "VALID" || !related.irn) {
      throw new Error("Credit/debit notes require a cleared (VALID) original NRS invoice.");
    }
    relatedIrn = related.irn;
  }

  const computed = computeLines(opts.lines);
  if (computed.length === 0) throw new Error("Add at least one line item.");
  if (opts.seller && !opts.seller.name.trim()) throw new Error("Seller company name is required.");
  if (opts.buyer && !opts.buyer.name.trim()) throw new Error("Buyer name is required.");

  const subtotal = Number(computed.reduce((s, l) => s + l.lineTotal, 0).toFixed(2));
  const vatTotal = Number(computed.reduce((s, l) => s + l.vatAmount, 0).toFixed(2));
  const grandTotal = Number((subtotal + vatTotal).toFixed(2));
  const invoiceNumber =
    opts.invoiceNumber?.trim() || (await nextInvoiceNumber(opts.tenantId, prefix));
  const issueDate = opts.issueDate ?? new Date();
  const includeQr = opts.includeQr !== false;
  const logoSnapshotUrl = opts.logoUrl || null;

  if (opts.persistBranding && opts.seller) {
    await prisma.branding.upsert({
      where: { tenantId: opts.tenantId },
      create: {
        tenantId: opts.tenantId,
        invoiceCompanyName: opts.seller.name.trim(),
        invoicePhone: opts.seller.phone?.trim() || null,
        invoiceEmail: opts.seller.email?.trim() || null,
        logoUrl: logoSnapshotUrl,
      },
      update: {
        invoiceCompanyName: opts.seller.name.trim(),
        invoicePhone: opts.seller.phone?.trim() || null,
        invoiceEmail: opts.seller.email?.trim() || null,
        ...(logoSnapshotUrl ? { logoUrl: logoSnapshotUrl } : {}),
      },
    });
  }

  const party = opts.partyId
    ? await prisma.party.findFirst({
        where: { id: opts.partyId, tenantId: opts.tenantId },
      })
    : null;

  const invoice = await prisma.invoice.create({
    data: {
      tenantId: opts.tenantId,
      partyId: party?.id ?? null,
      channel: "NRS",
      documentType,
      invoiceKind: opts.invoiceKind ?? "B2B",
      invoiceNumber,
      issueDate,
      dueDate: opts.dueDate ?? null,
      currency: opts.currency?.trim() || "NGN",
      status: "SUBMITTED",
      notes: opts.notes?.trim() || null,
      paymentTerms: opts.paymentTerms?.trim() || null,
      sellerName: opts.seller?.name.trim() || null,
      sellerAddress: opts.seller?.address?.trim() || null,
      sellerPhone: opts.seller?.phone?.trim() || null,
      sellerEmail: opts.seller?.email?.trim() || null,
      sellerTin: opts.seller?.tin?.trim() || null,
      buyerName: opts.buyer?.name.trim() || null,
      buyerAddress: opts.buyer?.address?.trim() || null,
      buyerEmail: opts.buyer?.email?.trim() || null,
      buyerPhone: opts.buyer?.phone?.trim() || null,
      includeQr,
      logoSnapshotUrl,
      relatedInvoiceId: opts.relatedInvoiceId || null,
      subtotal,
      vatTotal,
      grandTotal,
      lines: { create: computed },
      events: {
        create: {
          status: "SUBMITTED",
          message: "Submitted to MockNrsAdapter (not live NRS).",
        },
      },
    },
    include: { lines: true, party: true },
  });

  const adapter = getNrsAdapter();
  const result = await adapter.clearInvoice({
    invoiceNumber,
    serviceId: tenant.serviceId,
    issueDate,
    invoiceKind: invoice.invoiceKind,
    documentType,
    tin: tenant.tin,
    buyerTin: party?.tin,
    lines: computed,
    subtotal,
    vatTotal,
    grandTotal,
    relatedIrn,
  });

  const cleared = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: result.status,
      irn: result.irn,
      qrPayload: includeQr ? result.qrPayload : null,
      qrSvg: includeQr ? result.qrSvg : null,
      mockClearanceAt: result.clearedAt,
      validationMsg: result.message,
      events: {
        create: {
          status: result.status,
          message: result.message,
        },
      },
    },
    include: {
      lines: true,
      party: true,
      events: { orderBy: { createdAt: "asc" } },
      relatedInvoice: true,
    },
  });

  await prisma.auditEvent.create({
    data: {
      tenantId: opts.tenantId,
      userId: opts.userId,
      action: "INVOICE_CLEARED_MOCK",
      entity: "Invoice",
      entityId: cleared.id,
      meta: JSON.stringify({ irn: cleared.irn, status: cleared.status }),
    },
  });

  return cleared;
}
