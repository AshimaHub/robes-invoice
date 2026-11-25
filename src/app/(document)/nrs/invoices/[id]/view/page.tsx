import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { requireNrsGate } from "@/lib/nrs-gate";
import { prisma } from "@/lib/prisma";
import { NrsInvoiceDocument } from "@/components/nrs-invoice-document";
import { DownloadPdfButton, PrintButton } from "@/components/print-button";

export const instant = false;

export default async function NrsInvoiceViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  await requireNrsGate(session.tenantId, session.userId);
  const { id } = await params;

  const [invoice, tenant] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id, tenantId: session.tenantId, channel: "NRS" },
      include: { lines: true, party: true },
    }),
    prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } }),
  ]);

  if (!invoice) notFound();

  return (
    <div className="mx-auto max-w-[960px] px-3 py-6 sm:px-4">
      <div className="nrs-view-toolbar mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e10613]">
            NRS document view
          </p>
          <p className="text-sm text-black/60">
            Mock-cleared layout matching the sample Electronic Tax Invoice. Not live NRS.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/nrs/invoices/${invoice.id}`}
            className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm font-semibold text-[#111111]"
          >
            ← Detail
          </Link>
          <PrintButton className="rounded-md bg-[#e10613] px-3 py-2 text-sm font-semibold text-white hover:brightness-105" />
          <DownloadPdfButton
            fileName={invoice.invoiceNumber}
            className="rounded-md bg-[#111111] px-3 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-70"
          />
        </div>
      </div>

      <NrsInvoiceDocument invoice={invoice} tenant={tenant} />
    </div>
  );
}
