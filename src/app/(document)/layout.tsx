import { APP_NAME } from "@/lib/brand";
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
      <footer className="mt-auto bg-[#111111] print:hidden">
        <div className="mx-auto max-w-[960px] px-4 py-4 text-xs leading-relaxed text-white">
          <p>
            {APP_NAME} — company invoicing plus optional NRS mock clearance (not live Nigeria
            Revenue Service submission).
          </p>
          <p className="mt-1">© Ibrahim Abdullahi & Co 2026</p>
        </div>
      </footer>
    </div>
  );
}
