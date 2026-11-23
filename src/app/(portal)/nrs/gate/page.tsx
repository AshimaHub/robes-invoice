import { redirect } from "next/navigation";
import { NrsGateWizard } from "@/components/nrs-gate-wizard";
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
  const permitDemo = formData.get("permitDemo") === "1";
  const { completed } = await saveNrsGateAnswers(
    session.tenantId,
    session.userId,
    answers,
  );
  if (permitDemo) redirect("/company/invoices/new?demo=1");
  if (completed) redirect("/nrs?gate=passed");
  redirect("/nrs/gate?saved=1");
}

export const instant = false;

export default async function NrsGatePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const status = await getNrsGateStatus(session.tenantId, session.userId);

  return (
    <NrsGateWizard
      questions={NRS_GATE_QUESTIONS}
      initialAnswers={status.answers}
      completed={status.completed}
      saved={Boolean(params.saved)}
      saveAction={saveGateAction}
    />
  );
}
