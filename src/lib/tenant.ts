import { cache } from "react";
import { prisma } from "./prisma";

export const getTenantWithBranding = cache(async (tenantId: string) => {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { branding: true },
  });
});

export function brandingCssVars(branding: {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
} | null) {
  const primary = branding?.primaryColor ?? "#0B5E3C";
  const secondary = branding?.secondaryColor ?? "#C4A35A";
  const accent = branding?.accentColor ?? "#143D2B";
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
