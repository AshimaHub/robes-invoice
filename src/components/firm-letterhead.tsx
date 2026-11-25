import {
  APP_NAME,
  FIRM_ABUJA,
  FIRM_EMAILS,
  FIRM_KANO,
  FIRM_PHONES,
  FIRM_ROLE,
  FIRM_WEBSITE,
} from "@/lib/brand";

/** Centered firm name and offices on the invoice itself. */
export function FirmLetterhead() {
  return (
    <div className="min-w-0 flex-1 px-2 text-center">
      <h1 className="font-display text-xl leading-tight font-semibold text-[#111111] sm:text-2xl">
        {APP_NAME}
      </h1>
      <p className="text-[11px] font-semibold text-[#e10613]">{FIRM_ROLE}</p>
      <p className="mt-1 text-[11px] leading-snug text-[#1f2937]">
        <span className="font-semibold text-[#e10613]">Abuja Office: </span>
        {FIRM_ABUJA.join(" ")}
      </p>
      <p className="text-[11px] leading-snug text-[#1f2937]">
        <span className="font-semibold text-[#e10613]">Kano Office: </span>
        {FIRM_KANO.join(" ")}
      </p>
      <p className="text-[11px] text-[#1f2937]">Tel: {FIRM_PHONES.join(", ")}</p>
      <p className="text-[11px] text-[#1f2937]">
        {FIRM_WEBSITE} · {FIRM_EMAILS.join(" · ")}
      </p>
    </div>
  );
}
