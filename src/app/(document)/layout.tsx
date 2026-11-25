import { FirmFooter } from "@/components/firm-footer";
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
    <div className="document-shell nrs-document-shell flex min-h-screen flex-col bg-[#f3f3f3]">
      <div className="flex-1">{children}</div>
      <FirmFooter />
    </div>
  );
}
