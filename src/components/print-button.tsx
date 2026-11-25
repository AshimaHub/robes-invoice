"use client";

function invoiceSheet() {
  return document.querySelector(".nrs-doc, .company-doc") as HTMLElement | null;
}

export function PrintButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => printInvoice()}>
      Print
    </button>
  );
}

export function DownloadPdfButton({
  fileName,
  className,
}: {
  fileName: string;
  className?: string;
}) {
  return (
    <button type="button" className={className} onClick={() => printInvoice(fileName)}>
      Download PDF
    </button>
  );
}

function printInvoice(fileName?: string) {
  const node = invoiceSheet();
  const previousTitle = document.title;
  const previousZoom = node?.style.getPropertyValue("zoom") ?? "";
  if (fileName) document.title = fileName;
  if (node) {
    const zoom = Math.min(1, 1040 / Math.max(node.scrollHeight, 1));
    node.style.setProperty("zoom", String(zoom));
  }
  const restore = () => {
    document.title = previousTitle;
    if (node) {
      if (previousZoom) node.style.setProperty("zoom", previousZoom);
      else node.style.removeProperty("zoom");
    }
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
}
