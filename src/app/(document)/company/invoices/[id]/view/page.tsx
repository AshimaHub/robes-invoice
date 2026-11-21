import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CompanyInvoiceDocument } from "@/components/company-invoice-document";
import { PrintButton } from "@/components/print-button";

export const instant = false;

export default async function CompanyInvoiceViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, tenantId: session.tenantId, channel: "COMPANY" },
    include: { lines: true },
  });

  if (!invoice) notFound();

  return (
    <div className="mx-auto max-w-[920px] px-3 py-6 sm:px-4">
      <div className="company-view-toolbar mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0b5e3c]">
            Company invoice
          </p>
          <p className="text-sm text-black/60">
            Printable commercial invoice — not NRS clearance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/company/invoices/${invoice.id}`}
            className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm font-semibold text-[#143d2b]"
          >
            ← Detail
          </Link>
          <PrintButton className="rounded-md bg-[#0b5e3c] px-3 py-2 text-sm font-semibold text-white hover:brightness-105" />
        </div>
      </div>

      <CompanyInvoiceDocument invoice={invoice} />
    </div>
  );
}
