import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const A4_PREVIEW_WIDTH_PX = 595;
const A4_PREVIEW_HEIGHT_PX = 842;

export const createProposalPreviewPdfBlob = async (
  previewContainer: HTMLDivElement | null,
): Promise<Blob> => {
  if (!previewContainer) {
    throw new Error("No se encontro la vista previa para exportar.");
  }

  const pageElements = Array.from(
    previewContainer.querySelectorAll<HTMLElement>("[data-preview-page='true']"),
  );

  if (pageElements.length === 0) {
    throw new Error("No hay hojas en la vista previa para generar PDF.");
  }

  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const exportHost = document.createElement("div");
  exportHost.style.position = "fixed";
  exportHost.style.left = "-99999px";
  exportHost.style.top = "0";
  exportHost.style.width = `${A4_PREVIEW_WIDTH_PX}px`;
  exportHost.style.height = `${A4_PREVIEW_HEIGHT_PX}px`;
  exportHost.style.overflow = "hidden";
  exportHost.style.background = "#ffffff";
  document.body.appendChild(exportHost);

  try {
    for (let index = 0; index < pageElements.length; index += 1) {
      const pageClone = pageElements[index].cloneNode(true) as HTMLElement;
      pageClone.style.width = `${A4_PREVIEW_WIDTH_PX}px`;
      pageClone.style.height = `${A4_PREVIEW_HEIGHT_PX}px`;
      pageClone.style.maxWidth = `${A4_PREVIEW_WIDTH_PX}px`;
      pageClone.style.maxHeight = `${A4_PREVIEW_HEIGHT_PX}px`;
      pageClone.style.margin = "0";

      exportHost.innerHTML = "";
      exportHost.appendChild(pageClone);

      const imageData = await toPng(pageClone, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: A4_PREVIEW_WIDTH_PX,
        height: A4_PREVIEW_HEIGHT_PX,
        style: {
          width: `${A4_PREVIEW_WIDTH_PX}px`,
          height: `${A4_PREVIEW_HEIGHT_PX}px`,
          maxWidth: `${A4_PREVIEW_WIDTH_PX}px`,
          maxHeight: `${A4_PREVIEW_HEIGHT_PX}px`,
          margin: "0",
        },
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      if (index > 0) {
        pdf.addPage();
      }

      pdf.addImage(imageData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
    }
  } finally {
    if (exportHost.parentNode) {
      exportHost.parentNode.removeChild(exportHost);
    }
  }

  return pdf.output("blob");
};

export const proposalPdfBlobToBase64 = async (blob: Blob): Promise<string> => {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};
