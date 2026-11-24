"use client";

import { useRef, useState, type ReactNode } from "react";
import { APP_NAME } from "@/lib/brand";

const LAST = 3;

export function DemoClearanceWizard({
  invoiceNumber,
  sellerName,
  buyerName,
  lineCount,
  grandTotalLabel,
  irn,
  children,
}: {
  invoiceNumber: string;
  sellerName: string;
  buyerName: string;
  lineCount: number;
  grandTotalLabel: string;
  irn: string;
  children: ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const indexRef = useRef(0);

  function goTo(next: number) {
    const target = Math.max(0, Math.min(LAST, next));
    setDirection(target >= indexRef.current ? 1 : -1);
    indexRef.current = target;
    setIndex(target);
  }

  function downloadPdf() {
    const previous = document.title;
    document.title = invoiceNumber;
    window.print();
    document.title = previous;
  }

  const slideClass = direction > 0 ? "gate-slide-forward" : "gate-slide-back";

  return (
    <div className={`mx-auto space-y-4 ${index === LAST ? "max-w-4xl" : "max-w-xl"}`}>
      <div className="demo-clearance-chrome flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
        <span>NRS demo</span>
        <span>
          {index + 1} / {LAST + 1}
        </span>
      </div>

      <div
        key={index}
        className={`demo-clearance-panel panel space-y-5 p-6 sm:p-8 ${slideClass}`}
      >
        {index === 0 ? (
          <ValidateCard
            sellerName={sellerName}
            buyerName={buyerName}
            lineCount={lineCount}
            grandTotalLabel={grandTotalLabel}
          />
        ) : null}
        {index === 1 ? <SignCard /> : null}
        {index === 2 ? <ReceiptCard irn={irn} /> : null}
        {index === LAST ? (
          <>
            <DownloadCard />
            <div className="overflow-x-auto">{children}</div>
          </>
        ) : null}
      </div>

      <div className="demo-clearance-chrome flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => goTo(indexRef.current - 1)}
          disabled={index === 0}
        >
          Previous
        </button>
        {index === LAST ? (
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-secondary" onClick={downloadPdf}>
              Print
            </button>
            <button type="button" className="btn-primary" onClick={downloadPdf}>
              Download PDF
            </button>
          </div>
        ) : (
          <button type="button" className="btn-primary" onClick={() => goTo(indexRef.current + 1)}>
            {index === 1 ? "Sign & submit" : "Next"}
          </button>
        )}
      </div>
    </div>
  );
}

function ValidateCard({
  sellerName,
  buyerName,
  lineCount,
  grandTotalLabel,
}: {
  sellerName: string;
  buyerName: string;
  lineCount: number;
  grandTotalLabel: string;
}) {
  const checks = [
    `Seller: ${sellerName}`,
    `Buyer: ${buyerName}`,
    `${lineCount} line ${lineCount === 1 ? "item" : "items"}`,
    `Total: ${grandTotalLabel}`,
  ];
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Validate</p>
      <h1 className="font-display text-3xl text-[color:var(--brand-accent)]">Check the invoice</h1>
      <p className="text-sm leading-6 text-black/70">
        Validation is the check that runs before an invoice can be sent. It confirms the seller,
        the buyer, the lines, and the totals are present. An invoice that fails this check is not
        accepted. This demo invoice passed.
      </p>
      <ul className="space-y-2">
        {checks.map((item) => (
          <li key={item} className="rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold text-[color:var(--brand-accent)]">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignCard() {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
        Sign / Submit
      </p>
      <h1 className="font-display text-3xl text-[color:var(--brand-accent)]">Sign and submit</h1>
      <p className="text-sm leading-6 text-black/70">
        Signing means the business stands behind this invoice. Submit is the moment that signed
        invoice is sent for clearance. In a live setup, {APP_NAME} sends it on. This demo does not
        contact the live Nigeria Revenue Service.
      </p>
    </div>
  );
}

function ReceiptCard({ irn }: { irn: string }) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
        Confirm receipt / IRN
      </p>
      <h1 className="font-display text-3xl text-[color:var(--brand-accent)]">Receipt received</h1>
      <p className="text-sm leading-6 text-black/70">
        A receipt means the invoice was accepted. The Invoice Reference Number, or IRN, is the
        number on that receipt. It is how this invoice is identified after submission. The business
        and the buyer both keep it.
      </p>
      <p className="break-all rounded-xl border border-black/10 bg-white/80 px-4 py-3 font-mono text-sm text-[color:var(--brand-accent)]">
        {irn}
      </p>
    </div>
  );
}

function DownloadCard() {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
        Download / Print
      </p>
      <h1 className="font-display text-3xl text-[color:var(--brand-accent)]">Keep a copy</h1>
      <p className="text-sm leading-6 text-black/70">
        This is the invoice itself. Download PDF saves this preview as a PDF. Print puts the same
        copy on paper for the buyer or for the file.
      </p>
    </div>
  );
}
