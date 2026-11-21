import { requireSession } from "@/lib/auth";

/** Minimal chrome for fiscal document / print views (no portal nav). */
export default async function DocumentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  return <div className="nrs-document-shell min-h-screen bg-[#eef2f0]">{children}</div>;
}
