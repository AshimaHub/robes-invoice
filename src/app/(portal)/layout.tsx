import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { getTenantWithBranding } from "@/lib/tenant";

/** Auth + tenant branding are request-bound; allow blocking (no instant shell). */
export const instant = false;

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const tenant = await getTenantWithBranding(session.tenantId);

  return (
    <AppShell session={session} branding={tenant.branding}>
      {children}
    </AppShell>
  );
}
