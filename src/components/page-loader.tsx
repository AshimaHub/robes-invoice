export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-[color:var(--brand-primary)]" role="status">
      <span
        className="loader-spin inline-block h-11 w-11 rounded-full border-[3px] border-current border-r-transparent"
        aria-hidden
      />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}
