/** Lightweight CSS bar chart — no chart library dependency. */
export function SimpleBarChart({
  title,
  items,
  emptyLabel = "No data yet",
}: {
  title: string;
  items: { label: string; value: number; color?: string }[];
  emptyLabel?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 0);
  const hasData = items.some((i) => i.value > 0);

  return (
    <section className="panel p-5">
      <h2 className="font-display text-xl text-[color:var(--brand-accent)]">{title}</h2>
      {!hasData ? (
        <p className="mt-4 text-sm text-black/55">{emptyLabel}</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((item) => {
            const pct = max > 0 ? Math.round((item.value / max) * 100) : 0;
            return (
              <li key={item.label}>
                <div className="mb-1 flex justify-between text-xs text-black/60">
                  <span>{item.label}</span>
                  <span className="font-semibold text-[color:var(--brand-accent)]">
                    {item.value}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-black/8">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${pct}%`,
                      background:
                        item.color ??
                        "linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))",
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
