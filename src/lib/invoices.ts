import { prisma } from "./prisma";
import { getNrsAdapter } from "./nrs/mock-adapter";

export type LineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  hsnCode?: string;
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

export async function createAndClearInvoice(opts: {
  tenantId: string;
  userId: string;
  partyId?: string | null;
  invoiceKind?: string;
  documentType?: string;
  notes?: string;
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
      where: { id: opts.relatedInvoiceId, tenantId: opts.tenantId },
    });
    if (!related || related.status !== "VALID" || !related.irn) {
      throw new Error("Credit/debit notes require a cleared (VALID) original invoice.");
    }
    relatedIrn = related.irn;
  }

  const computed = computeLines(opts.lines);
  if (computed.length === 0) throw new Error("Add at least one line item.");

  const subtotal = Number(computed.reduce((s, l) => s + l.lineTotal, 0).toFixed(2));
  const vatTotal = Number(computed.reduce((s, l) => s + l.vatAmount, 0).toFixed(2));
  const grandTotal = Number((subtotal + vatTotal).toFixed(2));
  const invoiceNumber = await nextInvoiceNumber(opts.tenantId, prefix);
  const issueDate = new Date();

  const party = opts.partyId
    ? await prisma.party.findFirst({
        where: { id: opts.partyId, tenantId: opts.tenantId },
      })
    : null;

  const invoice = await prisma.invoice.create({
    data: {
      tenantId: opts.tenantId,
      partyId: party?.id ?? null,
      documentType,
      invoiceKind: opts.invoiceKind ?? "B2B",
      invoiceNumber,
      issueDate,
      status: "SUBMITTED",
      notes: opts.notes || null,
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
      qrPayload: result.qrPayload,
      qrSvg: result.qrSvg,
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
