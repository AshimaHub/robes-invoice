import { requireSession } from "@/lib/auth";

/** Session-gated document views; allow blocking (no instant shell). */
export const instant = false;

/** Minimal chrome for printable document views (no portal nav / auth motifs). */
export default async function DocumentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  return (
    <div className="document-shell nrs-document-shell min-h-screen bg-[#eef2f0]">
      {children}
    </div>
  );
}
