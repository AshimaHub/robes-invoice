import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import {
  NRS_GATE_QUESTIONS,
  getNrsGateStatus,
  saveNrsGateAnswers,
  type GateAnswer,
} from "@/lib/nrs-gate";

async function saveGateAction(formData: FormData) {
  "use server";
  const session = await requireSession();
  const answers: Record<string, GateAnswer> = {};
  for (const q of NRS_GATE_QUESTIONS) {
    const v = String(formData.get(q.id) || "");
    answers[q.id] = v === "yes" || v === "no" || v === "unsure" ? v : "";
  }
  const { completed } = await saveNrsGateAnswers(
    session.tenantId,
    session.userId,
    answers,
  );
  if (completed) redirect("/nrs?gate=passed");
  redirect("/nrs/gate?saved=1");
}

export default async function NrsGatePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const status = await getNrsGateStatus(session.tenantId, session.userId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
          NRS Compliant e-Invoice
        </p>
        <h1 className="font-display mt-1 text-3xl text-[color:var(--brand-accent)]">
          Readiness gate
        </h1>
        <p className="mt-2 text-sm text-black/60">
          Answer these prerequisite questions before creating or submitting NRS e-invoices.
          Progress is saved for your account in this organisation.
        </p>
      </div>

      {params.saved && !status.completed ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Progress saved. Resolve the blockers below, then save again to unlock NRS features.
        </p>
      ) : null}

      {status.completed ? (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Gate complete.{" "}
          <Link href="/nrs" className="font-semibold underline">
            Open NRS Compliant e-Invoice
          </Link>
        </div>
      ) : status.blockers.length > 0 ? (
        <div className="panel space-y-2 border-amber-200/80 bg-amber-50/80 p-4">
          <p className="font-semibold text-[color:var(--brand-accent)]">Blockers</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-black/75">
            {status.blockers.map((b) => (
              <li key={b.id}>
                <span className="font-medium">{b.prompt}</span> — {b.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form action={saveGateAction} className="panel space-y-5 p-5">
        {NRS_GATE_QUESTIONS.map((q, idx) => (
          <fieldset key={q.id} className="space-y-2 border-b border-black/8 pb-4 last:border-0">
            <legend className="font-semibold text-[color:var(--brand-accent)]">
              {idx + 1}. {q.prompt}
              {q.placeholder ? (
                <span className="ml-2 text-xs font-normal text-black/45">(placeholder)</span>
              ) : null}
            </legend>
            {q.help ? <p className="text-xs text-black/55">{q.help}</p> : null}
            {q.placeholder ? (
              <p className="text-sm text-black/50 italic">
                More questions will be added when requirements are confirmed. Optional for now.
              </p>
            ) : (
              <div className="flex flex-wrap gap-4 text-sm">
                {(["yes", "no", "unsure"] as const).map((opt) => (
                  <label key={opt} className="inline-flex items-center gap-2 capitalize">
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      defaultChecked={status.answers[q.id] === opt}
                      required={q.requireYes}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        ))}

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary">
            {status.completed ? "Update answers" : "Save & continue setup"}
          </button>
          <Link href="/dashboard" className="btn-secondary">
            Back to dashboard
          </Link>
        </div>
      </form>
    </div>
  );
}
