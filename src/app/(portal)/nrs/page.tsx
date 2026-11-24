import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { BackLink } from "@/components/back-link";
import { getNrsGateStatus } from "@/lib/nrs-gate";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/tenant";

export const instant = false;

export default async function NrsHubPage({
  searchParams,
}: {
  searchParams: Promise<{ gate?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const gate = await getNrsGateStatus(session.tenantId, session.userId);

  const [count, valid, agg] = await Promise.all([
    prisma.invoice.count({ where: { tenantId: session.tenantId, channel: "NRS" } }),
    prisma.invoice.count({
      where: { tenantId: session.tenantId, channel: "NRS", status: "VALID" },
    }),
    prisma.invoice.aggregate({
      where: { tenantId: session.tenantId, channel: "NRS" },
      _sum: { grandTotal: true },
    }),
  ]);

  if (!gate.completed) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <BackLink href="/dashboard" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
            NRS Compliant e-Invoice
          </p>
          <h1 className="font-display mt-1 text-3xl text-[color:var(--brand-accent)]">
            Setup required
          </h1>
          <p className="mt-2 text-sm text-black/60">
            Complete the readiness gate before creating or submitting NRS e-invoices. You will not
            be dropped into invoice create until prerequisites are met.
          </p>
        </div>

        <div className="panel space-y-3 border-amber-200/80 bg-amber-50/70 p-5">
          <p className="font-semibold text-[color:var(--brand-accent)]">
            Incomplete gate · {gate.answeredCount}/{gate.requiredCount} required answered
          </p>
          {gate.blockers.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-black/75">
              {gate.blockers.map((b) => (
                <li key={b.id}>
                  {b.prompt} — {b.reason}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-black/65">Start the questionnaire to unlock this module.</p>
          )}
          <Link href="/nrs/gate" className="btn-primary inline-flex">
            Continue setup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BackLink href="/dashboard" />
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
          NRS Compliant e-Invoice
        </p>
        <h1 className="font-display mt-1 text-3xl text-[color:var(--brand-accent)]">
          NRS workspace
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-black/60">
          Mock clearance only — IRN and QR are demo artefacts, not live Nigeria Revenue Service
          submission.
        </p>
        {params.gate === "passed" ? (
          <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Readiness gate passed. You can create NRS e-invoices.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/nrs/invoices/new" className="btn-primary">
            New NRS e-invoice
          </Link>
          <Link href="/nrs/invoices" className="btn-secondary">
            Invoice library
          </Link>
          <Link href="/nrs/invoices?status=VALID" className="btn-secondary">
            View cleared
          </Link>
          <Link href="/nrs/parties" className="btn-secondary">
            Parties
          </Link>
          <Link href="/nrs/gate" className="btn-secondary">
            Review gate answers
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="panel px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-black/50">NRS invoices</p>
          <p className="font-display mt-1 text-3xl text-[color:var(--brand-accent)]">{count}</p>
        </div>
        <div className="panel px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-black/50">Valid (mock)</p>
          <p className="font-display mt-1 text-3xl text-[color:var(--brand-accent)]">{valid}</p>
        </div>
        <div className="panel px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-black/50">Cleared total</p>
          <p className="font-display mt-1 text-2xl text-[color:var(--brand-accent)]">
            {formatMoney(agg._sum.grandTotal ?? 0)}
          </p>
        </div>
      </section>
    </div>
  );
}
