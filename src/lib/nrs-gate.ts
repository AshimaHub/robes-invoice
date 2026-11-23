import { redirect } from "next/navigation";
import { prisma } from "./prisma";

export type GateAnswer = "yes" | "no" | "unsure" | "";

export type GateQuestion = {
  id: string;
  prompt: string;
  help?: string;
  /** Must be answered "yes" to pass the gate */
  requireYes: boolean;
};

/** Questions a client answers before Robes sets up NRS e-invoicing. */
export const NRS_GATE_QUESTIONS: GateQuestion[] = [
  {
    id: "einvoice_enabled",
    prompt: "Is your company e-invoice enabled on NRS/MBS?",
    help: "Your organisation must be enrolled for electronic invoicing before clearance.",
    requireYes: true,
  },
  {
    id: "tin_registered",
    prompt: "Do you have a valid TIN registered with NRS?",
    help: "Taxpayer Identification Number used on fiscal documents.",
    requireYes: true,
  },
  {
    id: "business_service_id",
    prompt: "Do you have a Business ID and Service ID from NRS?",
    help: "Required identifiers for your integration profile.",
    requireYes: true,
  },
  {
    id: "credentials_ready",
    prompt: "Have you obtained sandbox or production API credentials?",
    help: "Vaulted secrets for the environment you will use. Live API is not wired yet — mock clearance is used until keys exist.",
    requireYes: true,
  },
  {
    id: "env_awareness",
    prompt: "Do you understand sandbox vs production, and that this app currently uses mock clearance only?",
    help: "Confirm you will not treat mock IRN/QR as live fiscalisation.",
    requireYes: true,
  },
];

export type GateStatus = {
  answers: Record<string, GateAnswer>;
  completed: boolean;
  completedAt: Date | null;
  blockers: { id: string; prompt: string; reason: string }[];
  answeredCount: number;
  requiredCount: number;
};

function parseAnswers(raw: string): Record<string, GateAnswer> {
  try {
    const parsed = JSON.parse(raw || "{}") as Record<string, string>;
    const out: Record<string, GateAnswer> = {};
    for (const q of NRS_GATE_QUESTIONS) {
      const v = parsed[q.id];
      if (v === "yes" || v === "no" || v === "unsure") out[q.id] = v;
      else out[q.id] = "";
    }
    return out;
  } catch {
    return Object.fromEntries(NRS_GATE_QUESTIONS.map((q) => [q.id, "" as GateAnswer]));
  }
}

export function evaluateGate(answers: Record<string, GateAnswer>): {
  completed: boolean;
  blockers: GateStatus["blockers"];
} {
  const blockers: GateStatus["blockers"] = [];
  for (const q of NRS_GATE_QUESTIONS) {
    if (!q.requireYes) continue;
    const a = answers[q.id] || "";
    if (a !== "yes") {
      blockers.push({
        id: q.id,
        prompt: q.prompt,
        reason:
          a === ""
            ? "Not answered yet"
            : a === "no"
              ? "Answered no — resolve this with NRS/MBS before continuing"
              : "Marked unsure — confirm before using NRS features",
      });
    }
  }
  return { completed: blockers.length === 0, blockers };
}

export async function getNrsGateStatus(
  tenantId: string,
  userId: string,
): Promise<GateStatus> {
  const row = await prisma.nrsGateProgress.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
  });
  const answers = parseAnswers(row?.answersJson ?? "{}");
  const { completed, blockers } = evaluateGate(answers);
  const requiredCount = NRS_GATE_QUESTIONS.filter((q) => q.requireYes).length;
  const answeredCount = NRS_GATE_QUESTIONS.filter(
    (q) => q.requireYes && (answers[q.id] === "yes" || answers[q.id] === "no" || answers[q.id] === "unsure"),
  ).length;

  return {
    answers,
    completed: Boolean(row?.completed && completed),
    completedAt: row?.completedAt ?? null,
    blockers,
    answeredCount,
    requiredCount,
  };
}

export async function saveNrsGateAnswers(
  tenantId: string,
  userId: string,
  answers: Record<string, GateAnswer>,
) {
  const { completed } = evaluateGate(answers);
  const answersJson = JSON.stringify(answers);
  const completedAt = completed ? new Date() : null;

  await prisma.nrsGateProgress.upsert({
    where: { tenantId_userId: { tenantId, userId } },
    create: {
      tenantId,
      userId,
      answersJson,
      completed,
      completedAt,
    },
    update: {
      answersJson,
      completed,
      completedAt,
    },
  });

  await prisma.auditEvent.create({
    data: {
      tenantId,
      userId,
      action: completed ? "NRS_GATE_PASSED" : "NRS_GATE_SAVED",
      entity: "NrsGateProgress",
      meta: JSON.stringify({ completed, answers }),
    },
  });

  return { completed };
}

/** Block NRS create/submit routes until gate passed. */
export async function requireNrsGate(tenantId: string, userId: string) {
  const status = await getNrsGateStatus(tenantId, userId);
  if (!status.completed) {
    redirect("/nrs/gate");
  }
  return status;
}
