import { notFound } from "next/navigation";
import { CompanyInvoiceDocument } from "@/components/company-invoice-document";
import { DemoClearanceWizard } from "@/components/demo-clearance-wizard";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/tenant";

export const instant = false;

export default async function DemoClearancePage({
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
    <DemoClearanceWizard
      invoiceNumber={invoice.invoiceNumber}
      sellerName={invoice.sellerName || "Seller"}
      buyerName={invoice.buyerName || "Buyer"}
      lineCount={invoice.lines.length}
      grandTotalLabel={formatMoney(invoice.grandTotal, invoice.currency)}
      irn={invoice.irn || "Pending"}
    >
      <CompanyInvoiceDocument invoice={invoice} />
    </DemoClearanceWizard>
  );
}
