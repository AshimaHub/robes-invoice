import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { requireNrsGate } from "@/lib/nrs-gate";
import { prisma } from "@/lib/prisma";

async function addPartyAction(formData: FormData) {
  "use server";
  const session = await requireSession();
  await requireNrsGate(session.tenantId, session.userId);
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect("/nrs/parties?error=Name%20required");

  await prisma.party.create({
    data: {
      tenantId: session.tenantId,
      type: "CUSTOMER",
      name,
      tin: String(formData.get("tin") || "") || null,
      email: String(formData.get("email") || "") || null,
      addressLine1: String(formData.get("addressLine1") || "") || null,
      city: String(formData.get("city") || "") || null,
      state: String(formData.get("state") || "") || null,
      lga: String(formData.get("lga") || "") || null,
    },
  });

  await prisma.auditEvent.create({
    data: {
      tenantId: session.tenantId,
      userId: session.userId,
      action: "PARTY_CREATED",
      entity: "Party",
      meta: JSON.stringify({ name }),
    },
  });

  redirect("/nrs/parties");
}

export const instant = false;

export default async function NrsPartiesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession();
  await requireNrsGate(session.tenantId, session.userId);
  const params = await searchParams;
  const parties = await prisma.party.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
          NRS Compliant e-Invoice
        </p>
        <h1 className="font-display mt-1 text-3xl text-[color:var(--brand-accent)]">
          Parties
        </h1>
        <p className="mt-2 text-sm text-black/60">
          A saved name can be used as the seller or the buyer.
        </p>
      </div>

      {params.error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {params.error}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="font-display text-xl text-[color:var(--brand-accent)]">
            Existing parties
          </h2>
          {parties.length === 0 ? (
            <p className="mt-3 text-sm text-black/55">No parties yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-black/8">
              {parties.map((p) => (
                <li key={p.id} className="py-3">
                  <p className="font-semibold text-[color:var(--brand-accent)]">{p.name}</p>
                  <p className="text-xs text-black/55">
                    TIN {p.tin ?? "—"} · {p.city ?? "—"}, {p.state ?? "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-xl text-[color:var(--brand-accent)]">Add party</h2>
          <form action={addPartyAction} className="mt-4 space-y-3">
            <div>
              <label className="label" htmlFor="name">
                Name
              </label>
              <input id="name" name="name" className="field" required />
            </div>
            <div>
              <label className="label" htmlFor="tin">
                TIN
              </label>
              <input id="tin" name="tin" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input id="email" name="email" type="email" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="addressLine1">
                Address
              </label>
              <input id="addressLine1" name="addressLine1" className="field" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="city">
                  City
                </label>
                <input id="city" name="city" className="field" />
              </div>
              <div>
                <label className="label" htmlFor="state">
                  State
                </label>
                <input id="state" name="state" className="field" />
              </div>
              <div>
                <label className="label" htmlFor="lga">
                  LGA
                </label>
                <input id="lga" name="lga" className="field" />
              </div>
            </div>
            <button type="submit" className="btn-primary">
              Save party
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
