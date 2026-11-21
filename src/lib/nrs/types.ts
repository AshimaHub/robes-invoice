export type NrsClearanceStatus = "SUBMITTED" | "VALID" | "INVALID";

export type NrsInvoicePayload = {
  invoiceNumber: string;
  serviceId: string;
  issueDate: Date;
  invoiceKind: string;
  documentType: string;
  tin: string;
  buyerTin?: string | null;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    lineTotal: number;
    vatAmount: number;
  }>;
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  relatedIrn?: string | null;
};

export type NrsClearanceResult = {
  status: NrsClearanceStatus;
  irn: string;
  qrPayload: string;
  qrSvg: string;
  message: string;
  clearedAt: Date;
};

export interface NrsAdapter {
  clearInvoice(payload: NrsInvoicePayload): Promise<NrsClearanceResult>;
}
