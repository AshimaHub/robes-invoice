import Link from "next/link";

export function BackLink({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center text-sm font-semibold text-[color:var(--brand-primary)] hover:underline"
    >
      ← {label}
    </Link>
  );
}
