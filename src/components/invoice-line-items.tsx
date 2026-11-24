"use client";

import { useEffect, useRef, useState } from "react";

type LineRow = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  applyVat: boolean;
  vatRate: string;
};

function startingRows(): LineRow[] {
  return [
    {
      id: "line-1",
      description: "Consulting services",
      quantity: "1",
      unitPrice: "150000",
      applyVat: true,
      vatRate: "7.5",
    },
  ];
}

function lineAmounts(row: LineRow) {
  const quantity = Number(row.quantity);
  const unitPrice = Number(row.unitPrice);
  const net =
    Number.isFinite(quantity) && Number.isFinite(unitPrice) ? quantity * unitPrice : 0;
  const rate = row.applyVat ? Number(row.vatRate) || 0 : 0;
  const vat = (net * rate) / 100;
  return { net, vat, total: net + vat, rate };
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
}

export function InvoiceLineItems() {
  const [rows, setRows] = useState<LineRow[]>(startingRows);
  const [currency, setCurrency] = useState("NGN");
  const nextId = useRef(2);

  useEffect(() => {
    const select = document.getElementById("currency");
    if (!(select instanceof HTMLSelectElement)) return;
    const sync = () => setCurrency(select.value || "NGN");
    sync();
    select.addEventListener("change", sync);
    return () => select.removeEventListener("change", sync);
  }, []);

  function update(id: string, patch: Partial<LineRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addRow() {
    const id = `line-${nextId.current++}`;
    setRows((current) => [
      ...current,
      {
        id,
        description: "",
        quantity: "",
        unitPrice: "",
        applyVat: false,
        vatRate: "7.5",
      },
    ]);
  }

  function removeRow(id: string) {
    setRows((current) => (current.length === 1 ? current : current.filter((row) => row.id !== id)));
  }

  const totals = rows.reduce(
    (sum, row) => {
      const amounts = lineAmounts(row);
      return {
        net: sum.net + amounts.net,
        vat: sum.vat + amounts.vat,
        total: sum.total + amounts.total,
      };
    },
    { net: 0, vat: 0, total: 0 },
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg text-[color:var(--brand-accent)]">Line items</h2>
        <button
          type="button"
          onClick={addRow}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <PlusIcon />
          Add row
        </button>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => {
          const amounts = lineAmounts(row);
          const started = row.quantity !== "" || row.unitPrice !== "";
          return (
            <div key={row.id} className="rounded-lg border border-black/10 bg-white/80 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[color:var(--brand-accent)]">
                  {started ? formatMoney(amounts.total, currency) : "—"}
                  <span className="ml-2 text-xs font-medium text-black/55">
                    {row.applyVat ? `incl. ${amounts.rate}% VAT` : "no VAT"}
                  </span>
                </p>
                <button
                  type="button"
                  className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 text-sm font-semibold text-rose-800 disabled:border-black/15 disabled:bg-white disabled:text-black/45"
                  aria-label="Delete this line"
                  disabled={rows.length === 1}
                  onClick={() => removeRow(row.id)}
                >
                  <TrashIcon />
                  Delete
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_5.5rem_7.5rem_9.5rem]">
              <div className="col-span-2 sm:col-span-1">
                <label className="label sm:sr-only" htmlFor={`${row.id}-description`}>
                  Description
                </label>
                <input
                  id={`${row.id}-description`}
                  name="description"
                  className="field"
                  placeholder="Description"
                  value={row.description}
                  required={index === 0}
                  onChange={(event) => update(row.id, { description: event.target.value })}
                />
              </div>
              <div>
                <label className="label sm:sr-only" htmlFor={`${row.id}-quantity`}>
                  Qty
                </label>
                <input
                  id={`${row.id}-quantity`}
                  name="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  className="field"
                  placeholder="Qty"
                  value={row.quantity}
                  required={index === 0}
                  onChange={(event) => update(row.id, { quantity: event.target.value })}
                />
              </div>
              <div>
                <label className="label sm:sr-only" htmlFor={`${row.id}-price`}>
                  Unit price
                </label>
                <input
                  id={`${row.id}-price`}
                  name="unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  className="field"
                  placeholder="Unit price"
                  value={row.unitPrice}
                  required={index === 0}
                  onChange={(event) => update(row.id, { unitPrice: event.target.value })}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="label sm:sr-only">VAT</p>
                <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-[color:var(--brand-accent)]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[color:var(--brand-primary)]"
                    checked={row.applyVat}
                    onChange={(event) => update(row.id, { applyVat: event.target.checked })}
                  />
                  Apply VAT
                </label>
                <input type="hidden" name="vatRate" value={row.applyVat ? row.vatRate || "7.5" : "0"} />
              </div>
              </div>
            </div>
          );
        })}
      </div>

      <dl className="grid gap-2 rounded-lg bg-white/70 p-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">Subtotal</dt>
          <dd className="mt-1 font-semibold text-[color:var(--brand-accent)]">
            {formatMoney(totals.net, currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">VAT</dt>
          <dd className="mt-1 font-semibold text-[color:var(--brand-accent)]">
            {formatMoney(totals.vat, currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">Total</dt>
          <dd className="mt-1 font-semibold text-[color:var(--brand-accent)]">
            {formatMoney(totals.total, currency)}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
      <path
        d="M3.5 4.5h9M6.5 4.5V3.2A.7.7 0 0 1 7.2 2.5h1.6a.7.7 0 0 1 .7.7v1.3M5 4.5l.5 8.2a.8.8 0 0 0 .8.8h3.4a.8.8 0 0 0 .8-.8L11 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
