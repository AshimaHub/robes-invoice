import { redirect } from "next/navigation";
import { isAdmin, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantWithBranding } from "@/lib/tenant";

async function saveBrandingAction(formData: FormData) {
  "use server";
  const session = await requireSession();
  if (!isAdmin(session.role)) {
    redirect("/app/branding?error=Admin%20only");
  }

  const primaryColor = String(formData.get("primaryColor") || "#0B5E3C");
  const secondaryColor = String(formData.get("secondaryColor") || "#C4A35A");
  const accentColor = String(formData.get("accentColor") || "#143D2B");
  const loginHeroText = String(formData.get("loginHeroText") || "");
  const emailFromName = String(formData.get("emailFromName") || "");
  const domainHint = String(formData.get("domainHint") || "");

  await prisma.branding.upsert({
    where: { tenantId: session.tenantId },
    create: {
      tenantId: session.tenantId,
      primaryColor,
      secondaryColor,
      accentColor,
      loginHeroText: loginHeroText || null,
      emailFromName: emailFromName || null,
      domainHint: domainHint || null,
    },
    update: {
      primaryColor,
      secondaryColor,
      accentColor,
      loginHeroText: loginHeroText || null,
      emailFromName: emailFromName || null,
      domainHint: domainHint || null,
    },
  });

  await prisma.auditEvent.create({
    data: {
      tenantId: session.tenantId,
      userId: session.userId,
      action: "BRANDING_UPDATED",
      entity: "Branding",
    },
  });

  redirect("/app/branding?saved=1");
}

export default async function BrandingPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const tenant = await getTenantWithBranding(session.tenantId);
  const b = tenant.branding;
  const admin = isAdmin(session.role);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
          White-label
        </p>
        <h1 className="font-display mt-1 text-3xl text-[color:var(--brand-accent)]">
          Branding
        </h1>
        <p className="mt-2 text-sm text-black/60">
          Colors apply to the app chrome and login for this tenant. Domain hint is
          informational until DNS is wired.
        </p>
      </div>

      {params.saved ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Branding saved. Refresh or navigate to see the shell update.
        </p>
      ) : null}
      {params.error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {params.error}
        </p>
      ) : null}

      {!admin ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          View only — Tenant Admin can edit branding.
        </p>
      ) : null}

      <form action={saveBrandingAction} className="panel space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="primaryColor">
              Primary
            </label>
            <input
              id="primaryColor"
              name="primaryColor"
              type="color"
              className="h-10 w-full cursor-pointer rounded border border-black/10"
              defaultValue={b?.primaryColor ?? "#0B5E3C"}
              disabled={!admin}
            />
          </div>
          <div>
            <label className="label" htmlFor="secondaryColor">
              Secondary
            </label>
            <input
              id="secondaryColor"
              name="secondaryColor"
              type="color"
              className="h-10 w-full cursor-pointer rounded border border-black/10"
              defaultValue={b?.secondaryColor ?? "#C4A35A"}
              disabled={!admin}
            />
          </div>
          <div>
            <label className="label" htmlFor="accentColor">
              Accent
            </label>
            <input
              id="accentColor"
              name="accentColor"
              type="color"
              className="h-10 w-full cursor-pointer rounded border border-black/10"
              defaultValue={b?.accentColor ?? "#143D2B"}
              disabled={!admin}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="loginHeroText">
            Login hero text
          </label>
          <input
            id="loginHeroText"
            name="loginHeroText"
            className="field"
            defaultValue={b?.loginHeroText ?? ""}
            disabled={!admin}
          />
        </div>
        <div>
          <label className="label" htmlFor="emailFromName">
            Email from-name
          </label>
          <input
            id="emailFromName"
            name="emailFromName"
            className="field"
            defaultValue={b?.emailFromName ?? ""}
            disabled={!admin}
          />
        </div>
        <div>
          <label className="label" htmlFor="domainHint">
            Domain hint
          </label>
          <input
            id="domainHint"
            name="domainHint"
            className="field"
            defaultValue={b?.domainHint ?? ""}
            disabled={!admin}
            placeholder="einvoice.client.com"
          />
        </div>

        {admin ? (
          <button type="submit" className="btn-primary">
            Save branding
          </button>
        ) : null}
      </form>
    </div>
  );
}
