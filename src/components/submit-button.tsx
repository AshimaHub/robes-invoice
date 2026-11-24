"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingLabel,
  className = "btn-primary",
  name,
  value,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending, data } = useFormStatus();
  const matched = !name || data?.get(name) === value;
  const active = pending && matched;

  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={`${className} inline-flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-70`}
      disabled={pending}
      aria-busy={active}
    >
      {active ? (
        <>
          <span
            className="loader-spin inline-block h-4 w-4 shrink-0 rounded-full border-2 border-current border-r-transparent"
            aria-hidden
          />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
