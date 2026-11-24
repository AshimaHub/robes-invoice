"use client";

import { useRef, useState } from "react";

type GateAnswer = "yes" | "no" | "unsure" | "";

type GateQuestion = {
  id: string;
  prompt: string;
  help?: string;
  requireYes: boolean;
};

const CHOICES = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
] as const;

export function NrsGateWizard({
  questions,
  initialAnswers,
  completed,
  saved,
  saveAction,
}: {
  questions: GateQuestion[];
  initialAnswers: Record<string, GateAnswer>;
  completed: boolean;
  saved: boolean;
  saveAction: (formData: FormData) => void | Promise<void>;
}) {
  const [answers, setAnswers] = useState(initialAnswers);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const lastCard = questions.length + 1;
  const question = index > 0 && index <= questions.length ? questions[index - 1] : null;
  const questionAnswered = Boolean(question && answers[question.id]);

  function goTo(next: number) {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    const target = Math.max(0, Math.min(lastCard, next));
    setDirection(target >= indexRef.current ? 1 : -1);
    indexRef.current = target;
    setIndex(target);
  }

  function choose(id: string, value: GateAnswer) {
    setAnswers((current) => ({ ...current, [id]: value }));
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => goTo(indexRef.current + 1), 220);
  }

  const slideClass = direction > 0 ? "gate-slide-forward" : "gate-slide-back";

  return (
    <form action={saveAction} className="mx-auto max-w-xl space-y-4">
      {questions.map((item) => (
        <input key={item.id} type="hidden" name={item.id} value={answers[item.id] || ""} />
      ))}

      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
        <span>NRS Compliant e-Invoice</span>
        <span>
          {index + 1} / {lastCard + 1}
        </span>
      </div>

      <div key={index} className={`panel min-h-[28rem] p-6 sm:p-8 ${slideClass}`}>
        {index === 0 ? <BriefingCard completed={completed} saved={saved} /> : null}

        {question ? (
          <QuestionCard
            number={index}
            question={question}
            answer={answers[question.id] || ""}
            onChoose={(value) => choose(question.id, value)}
          />
        ) : null}

        {index === lastCard ? (
          unsureQuestions(questions, answers).length > 0 ? (
            <BlockersCard questions={unsureQuestions(questions, answers)} />
          ) : (
            <SaveCard questions={questions} answers={answers} />
          )
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => goTo(indexRef.current - 1)}
          disabled={index === 0}
        >
          Previous
        </button>
        {index === lastCard ? (
          unsureQuestions(questions, answers).length > 0 ? (
            <button type="submit" name="permitDemo" value="1" className="btn-primary w-full sm:w-auto">
              Permit me to see Demo
            </button>
          ) : (
            <button type="submit" className="btn-primary w-full sm:w-auto">
              Save & create invoice
            </button>
          )
        ) : (
          <button
            type="button"
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => goTo(indexRef.current + 1)}
            disabled={Boolean(question) && !questionAnswered}
          >
            Next
          </button>
        )}
      </div>
    </form>
  );
}

function BriefingCard({ completed, saved }: { completed: boolean; saved: boolean }) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Briefing</p>
      <h1 className="font-display text-3xl text-[color:var(--brand-accent)]">NRS e-Invoice</h1>
      <p className="text-sm leading-6 text-black/70">
        NRS e-invoicing is how a business issues invoices the Nigeria Revenue Service can clear.
        Ibrahim Abdullahi & Co sets that up for a client so the organisation can send compliant
        e-invoices instead of paper or ordinary PDF bills.
      </p>
      <p className="text-sm leading-6 text-black/70">
        The next cards ask one question at a time about enrolment, tax identity, and credentials.
        Choose an answer on each card before it moves on. If any answer is Not sure, the last card
        lists those blockers and can open the same manual invoice used for a company bill.
      </p>
      {saved && !completed ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Progress saved. A yes is still needed on every question before NRS e-invoicing opens.
        </p>
      ) : null}
      {completed ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          This organisation is ready. You can review the answers or go back to the dashboard.
        </p>
      ) : null}
    </div>
  );
}

function QuestionCard({
  number,
  question,
  answer,
  onChoose,
}: {
  number: number;
  question: GateQuestion;
  answer: GateAnswer;
  onChoose: (value: GateAnswer) => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
        Question {number}
      </p>
      <h1 className="font-display text-3xl text-[color:var(--brand-accent)]">{question.prompt}</h1>
      {question.help ? <p className="text-sm text-black/65">{question.help}</p> : null}
      <div className="grid gap-3">
        {CHOICES.map((choice) => {
          const selected = answer === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChoose(choice.value)}
              className={`rounded-xl border px-4 py-4 text-left text-base font-semibold ${
                selected
                  ? "border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)] text-white"
                  : "border-black/10 bg-white text-[color:var(--brand-accent)] hover:border-[color:var(--brand-primary)]"
              }`}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function unsureQuestions(questions: GateQuestion[], answers: Record<string, GateAnswer>) {
  return questions.filter((question) => answers[question.id] === "unsure");
}

function BlockersCard({ questions }: { questions: GateQuestion[] }) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Blockers</p>
      <h1 className="font-display text-3xl text-[color:var(--brand-accent)]">Not sure yet</h1>
      <p className="text-sm leading-6 text-black/70">
        These answers are not confirmed, so NRS e-invoicing stays locked. You can still open the
        demo and create an invoice the same way as a manual company invoice.
      </p>
      <ul className="space-y-2">
        {questions.map((question) => (
          <li key={question.id} className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3">
            <p className="text-sm font-semibold text-[color:var(--brand-accent)]">{question.prompt}</p>
            <p className="mt-1 text-sm text-black/60">Not sure</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SaveCard({
  questions,
  answers,
}: {
  questions: GateQuestion[];
  answers: Record<string, GateAnswer>;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Last step</p>
      <h1 className="font-display text-3xl text-[color:var(--brand-accent)]">Save your answers</h1>
      <p className="text-sm text-black/65">
        Saving these answers opens the invoice form. You can come back and change any answer.
      </p>
      <ul className="space-y-2">
        {questions.map((question) => (
            <li key={question.id} className="rounded-xl border border-black/10 bg-white/80 px-4 py-3">
              <p className="text-sm font-semibold text-[color:var(--brand-accent)]">{question.prompt}</p>
              <p className="mt-1 text-sm capitalize text-black/60">
                {answers[question.id] === "unsure"
                  ? "Not sure"
                  : answers[question.id] || "Not answered"}
              </p>
            </li>
          ))}
      </ul>
    </div>
  );
}
