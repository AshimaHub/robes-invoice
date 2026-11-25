const styles: Record<string, string> = {
  DRAFT: "bg-stone-200 text-stone-800",
  ISSUED: "bg-[#F6E8E9] text-[#111111]",
  VOID: "bg-slate-200 text-slate-700",
  SUBMITTED: "bg-[#F6E8E9] text-[#111111]",
  VALID: "bg-[#F6E8E9] text-[#111111]",
  INVALID: "bg-rose-100 text-rose-900",
  CANCELED: "bg-slate-200 text-slate-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium tracking-wide ${styles[status] ?? "bg-stone-100 text-stone-700"}`}
    >
      {status}
    </span>
  );
}
