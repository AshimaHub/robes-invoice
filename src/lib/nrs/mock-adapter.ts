import QRCode from "qrcode";
import type { NrsAdapter, NrsClearanceResult, NrsInvoicePayload } from "./types";

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/**
 * MockNrsAdapter — sandbox/demo clearance only.
 * Does NOT call live NRS / MBS APIs. Swap for NrsHttpClient in Slice 1.
 */
export class MockNrsAdapter implements NrsAdapter {
  async clearInvoice(payload: NrsInvoicePayload): Promise<NrsClearanceResult> {
    const ymd = formatYmd(payload.issueDate);
    const irn = `${payload.invoiceNumber}-${payload.serviceId}-${ymd}`;
    const qrPayload = JSON.stringify({
      irn,
      tin: payload.tin,
      amount: payload.grandTotal,
      currency: "NGN",
      mode: "MOCK_SANDBOX",
      verifiedAt: new Date().toISOString(),
    });

    const qrSvg = await QRCode.toString(qrPayload, {
      type: "svg",
      margin: 1,
      width: 180,
      color: { dark: "#111111", light: "#FFFFFF" },
    });

    // Simulate a brief clearance pipeline delay feel without blocking UX long.
    await new Promise((r) => setTimeout(r, 250));

    return {
      status: "VALID",
      irn,
      qrPayload,
      qrSvg,
      message: "Mock clearance accepted (sandbox simulator — not live NRS).",
      clearedAt: new Date(),
    };
  }
}

export function getNrsAdapter(): NrsAdapter {
  // Slice 0: always mock. Slice 1 will branch on tenant credentials / env.
  return new MockNrsAdapter();
}
