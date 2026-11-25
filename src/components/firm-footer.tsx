import {
  APP_LOGO,
  APP_NAME,
  FIRM_ABUJA,
  FIRM_EMAILS,
  FIRM_KANO,
  FIRM_NOTE,
  FIRM_PHONES,
  FIRM_ROLE,
  FIRM_WEBSITE,
} from "@/lib/brand";

/** Short three-column bar: identity, offices, contact. Hidden when printing. */
export function FirmFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`mt-auto bg-[#111111] text-white print:hidden ${className}`}>
      <div className="mx-auto grid w-full max-w-6xl gap-3 px-4 py-3 text-xs leading-snug sm:grid-cols-3 sm:gap-6">
        <div className="flex min-w-0 items-start gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={APP_LOGO}
            alt=""
            className="h-10 w-auto max-w-[3.25rem] shrink-0 rounded bg-white object-contain p-0.5"
          />
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-display)] text-sm leading-tight text-white">
              {APP_NAME}
            </p>
            <p className="text-[11px] text-white/70">{FIRM_ROLE}</p>
            <p className="mt-1 text-[11px] text-white/70">
              {APP_NAME} — {FIRM_NOTE}
            </p>
          </div>
        </div>
        <div>
          <p className="font-semibold text-[#e10613]">Abuja Office</p>
          {FIRM_ABUJA.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <p className="mt-1.5 font-semibold text-[#e10613]">Kano Office</p>
          {FIRM_KANO.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-white/60 uppercase">
            Contact
          </p>
          <p className="mt-1">Tel: {FIRM_PHONES.join(", ")}</p>
          <p>{FIRM_WEBSITE}</p>
          {FIRM_EMAILS.map((email) => (
            <p key={email}>{email}</p>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto w-full max-w-6xl px-4 py-2 text-[11px] text-white/75">
          © Ibrahim Abdullahi & Co 2026
        </p>
      </div>
    </footer>
  );
}
