import { cache } from "react";
import { APP_LOGO, APP_NAME, BRAND_BLACK, BRAND_LIME, BRAND_RED, LEGACY_DEMO_LOGO } from "./brand";
import { prisma } from "./prisma";

function withoutAcme(value: string) {
  return value
    .replaceAll("Acme Foods Nigeria Limited", APP_NAME)
    .replaceAll("Acme Foods", APP_NAME);
}

/** Drop the sample Acme Foods name from the signed-in organisation and its invoices. */
export const forgetAcmeFoods = cache(async (tenantId: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { branding: true },
  });
  if (!tenant) return;
  const email = tenant.branding?.invoiceEmail ?? "";
  const marked =
    tenant.name.includes("Acme Foods") ||
    tenant.legalName.includes("Acme Foods") ||
    (tenant.branding?.invoiceCompanyName ?? "").includes("Acme Foods") ||
    email.toLowerCase().includes("acmefoods");
  if (!marked) return;

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      name: withoutAcme(tenant.name),
      legalName: withoutAcme(tenant.legalName),
    },
  });
  if (tenant.branding) {
    await prisma.branding.update({
      where: { id: tenant.branding.id },
      data: {
        invoiceCompanyName: tenant.branding.invoiceCompanyName
          ? withoutAcme(tenant.branding.invoiceCompanyName)
          : APP_NAME,
        invoiceEmail: email.toLowerCase().includes("acmefoods") ? null : tenant.branding.invoiceEmail,
      },
    });
  }
  const invoices = await prisma.invoice.findMany({
    where: { tenantId },
    select: { id: true, sellerName: true, buyerName: true, sellerEmail: true },
  });
  for (const invoice of invoices) {
    const sellerName = invoice.sellerName?.includes("Acme Foods")
      ? withoutAcme(invoice.sellerName)
      : invoice.sellerName;
    const buyerName = invoice.buyerName?.includes("Acme Foods")
      ? withoutAcme(invoice.buyerName)
      : invoice.buyerName;
    const sellerEmail = invoice.sellerEmail?.toLowerCase().includes("acmefoods")
      ? null
      : invoice.sellerEmail;
    if (
      sellerName === invoice.sellerName &&
      buyerName === invoice.buyerName &&
      sellerEmail === invoice.sellerEmail
    ) {
      continue;
    }
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { sellerName, buyerName, sellerEmail },
    });
  }
});

export const getTenantWithBranding = cache(async (tenantId: string) => {
  await forgetAcmeFoods(tenantId);
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { branding: true },
  });
  if (!tenant?.branding) return tenant;
  if (
    tenant.branding.primaryColor.toLowerCase() !== BRAND_RED.toLowerCase() ||
    tenant.branding.secondaryColor.toLowerCase() !== BRAND_LIME.toLowerCase() ||
    tenant.branding.accentColor.toLowerCase() !== BRAND_BLACK.toLowerCase()
  ) {
    await prisma.branding.update({
      where: { id: tenant.branding.id },
      data: {
        primaryColor: BRAND_RED,
        secondaryColor: BRAND_LIME,
        accentColor: BRAND_BLACK,
      },
    });
    tenant.branding.primaryColor = BRAND_RED;
    tenant.branding.secondaryColor = BRAND_LIME;
    tenant.branding.accentColor = BRAND_BLACK;
  }
  const currentLogo = tenant.branding.logoUrl;
  const replaceLogo =
    !currentLogo ||
    currentLogo === LEGACY_DEMO_LOGO ||
    tenant.branding.emailFromName === "Robes Invoice";
  if (!replaceLogo) return tenant;

  await prisma.branding.update({
    where: { id: tenant.branding.id },
    data: { logoUrl: APP_LOGO, emailFromName: APP_NAME },
  });
  await prisma.invoice.updateMany({
    where: {
      tenantId,
      OR: [
        { logoSnapshotUrl: LEGACY_DEMO_LOGO },
        ...(currentLogo ? [{ logoSnapshotUrl: currentLogo }] : []),
      ],
    },
    data: { logoSnapshotUrl: APP_LOGO },
  });
  tenant.branding.logoUrl = APP_LOGO;
  tenant.branding.emailFromName = APP_NAME;
  return tenant;
});

export function brandingCssVars(branding: {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
} | null) {
  const primary = BRAND_RED;
  const secondary = BRAND_LIME;
  const accent = BRAND_BLACK;
  void branding;
  return {
    ["--brand-primary" as string]: primary,
    ["--brand-secondary" as string]: secondary,
    ["--brand-accent" as string]: accent,
  };
}

export function formatMoney(amount: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
