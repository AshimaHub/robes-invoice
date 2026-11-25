"use client";

import { useState } from "react";

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
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() => downloadInvoicePdf(fileName, setPending)}
    >
      {pending ? "Preparing PDF…" : "Download PDF"}
    </button>
  );
}

function fitOnePage(node: HTMLElement) {
  const previous = node.style.getPropertyValue("zoom");
  const zoom = Math.min(1, 900 / Math.max(node.offsetHeight, 1));
  node.style.setProperty("zoom", String(zoom));
  return () => {
    if (previous) node.style.setProperty("zoom", previous);
    else node.style.removeProperty("zoom");
  };
}

function printInvoice() {
  const node = invoiceSheet();
  const restoreZoom = node ? fitOnePage(node) : null;
  const restore = () => {
    restoreZoom?.();
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
}

async function downloadInvoicePdf(fileName: string, setPending: (value: boolean) => void) {
  const node = invoiceSheet();
  if (!node) return;
  setPending(true);
  try {
    const shot = await paintInvoice(node);
    const pdf = jpegToSinglePagePdf(shot.jpeg, shot.width, shot.height);
    const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } finally {
    setPending(false);
  }
}

async function paintInvoice(node: HTMLElement) {
  const width = node.offsetWidth;
  const height = node.offsetHeight;
  const origin = node.getBoundingClientRect();
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not draw the invoice");
  context.scale(scale, scale);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  const elements = [node, ...node.querySelectorAll("*")];
  for (const element of elements) {
    if (!(element instanceof HTMLElement)) continue;
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const box = element.getBoundingClientRect();
    const x = box.left - origin.left;
    const y = box.top - origin.top;
    const background = style.backgroundColor;
    if (background && background !== "rgba(0, 0, 0, 0)" && background !== "transparent") {
      context.fillStyle = background;
      fillRoundRect(context, x, y, box.width, box.height, parseFloat(style.borderTopLeftRadius) || 0);
    }
    const border = parseFloat(style.borderTopWidth);
    if (border > 0 && style.borderTopStyle !== "none") {
      context.strokeStyle = style.borderTopColor;
      context.lineWidth = border;
      context.strokeRect(x + border / 2, y + border / 2, box.width - border, box.height - border);
    }
    if (element instanceof HTMLImageElement && element.naturalWidth > 0) {
      context.drawImage(element, x, y, box.width, box.height);
    }
  }

  for (const svg of node.querySelectorAll("svg")) {
    const box = svg.getBoundingClientRect();
    const image = await svgToImage(svg);
    context.drawImage(
      image,
      box.left - origin.left,
      box.top - origin.top,
      box.width,
      box.height,
    );
  }

  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let textNode = walker.nextNode();
  while (textNode) {
    const parent = textNode.parentElement;
    const raw = textNode.textContent ?? "";
    if (parent && raw.trim() && !parent.closest("svg")) {
      const style = getComputedStyle(parent);
      context.font = style.font;
      context.fillStyle = style.color;
      context.textBaseline = "top";
      const range = document.createRange();
      range.selectNodeContents(textNode);
      const box = range.getBoundingClientRect();
      const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.35;
      const lines = raw
        .split("\n")
        .flatMap((part) => wrapLine(context, part.trim(), Math.max(box.width, 1)))
        .filter(Boolean);
      lines.forEach((line, index) => {
        context.fillText(line, box.left - origin.left, box.top - origin.top + index * lineHeight, box.width);
      });
    }
    textNode = walker.nextNode();
  }

  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const jpeg = Uint8Array.from(atob(dataUrl.split(",")[1] || ""), (char) => char.charCodeAt(0));
  return { jpeg, width: canvas.width, height: canvas.height };
}

function wrapLine(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && context.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fillRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.roundRect(x, y, width, height, r);
  context.fill();
}

function svgToImage(svg: SVGSVGElement) {
  const xml = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not draw the QR code"));
    };
    image.src = url;
  });
}

function jpegToSinglePagePdf(jpeg: Uint8Array, pixelWidth: number, pixelHeight: number) {
  const pageW = 595.28;
  const pageH = 841.89;
  const margin = 18;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;
  const ratio = pixelWidth / pixelHeight;
  let drawW = maxW;
  let drawH = drawW / ratio;
  if (drawH > maxH) {
    drawH = maxH;
    drawW = drawH * ratio;
  }
  const x = (pageW - drawW) / 2;
  const y = (pageH - drawH) / 2;
  const content = `q\n${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im0 Do\nQ\n`;
  const header = new TextEncoder().encode("%PDF-1.3\n");
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}endstream\nendobj\n`,
    `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
  ];
  const chunks: Uint8Array[] = [header];
  const offsets = [0];
  let position = header.length;
  for (const source of objects) {
    offsets.push(position);
    const bytes = new TextEncoder().encode(source);
    chunks.push(bytes);
    position += bytes.length;
  }
  chunks.push(jpeg);
  position += jpeg.length;
  const tail = new TextEncoder().encode("\nendstream\nendobj\n");
  chunks.push(tail);
  position += tail.length;
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  for (let index = 1; index <= 5; index += 1) {
    xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${position}\n%%EOF`;
  chunks.push(new TextEncoder().encode(xref));
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const pdf = new Uint8Array(total);
  let cursor = 0;
  for (const chunk of chunks) {
    pdf.set(chunk, cursor);
    cursor += chunk.length;
  }
  return pdf;
}
