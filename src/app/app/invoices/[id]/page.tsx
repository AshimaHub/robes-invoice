import { redirect } from "next/navigation";

export const instant = false;

export default async function LegacyInvoiceDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/nrs/invoices/${id}`);
}
