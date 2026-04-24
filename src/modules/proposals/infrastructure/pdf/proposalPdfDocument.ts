import { promises as fs } from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Proposal } from "../../domain/entities/Proposal";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN_X = 48;
const MARGIN_BOTTOM = 64;
const LINE_HEIGHT = 16;
const HEADER_HEIGHT = 112;
const FOOTER_HEIGHT = 32;

type PdfLine = {
  text: string;
  size: number;
  bold?: boolean;
  color?: { r: number; g: number; b: number };
  spacingAfter?: number;
};

const normalizeText = (value: string | undefined): string => (value ?? "").trim();

const splitLines = (value: string): string[] =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const formatMoneyWithoutDecimals = (value: number): string =>
  new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));

const wrapText = (text: string, maxWidth: number, measure: (value: string) => number): string[] => {
  if (!text.trim()) {
    return [""];
  }

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measure(candidate) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    if (measure(word) <= maxWidth) {
      current = word;
      continue;
    }

    let segment = "";
    for (const char of word) {
      const next = segment + char;
      if (measure(next) <= maxWidth) {
        segment = next;
      } else {
        if (segment) {
          lines.push(segment);
        }
        segment = char;
      }
    }
    current = segment;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
};

export const sanitizeFileName = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "propuesta";

const buildLines = (proposal: Proposal): PdfLine[] => {
  const snap = proposal.snapshot;
  const visibleSections = snap.sections.filter((section) => section.isVisible);
  const lines: PdfLine[] = [
    {
      text: "Cliente",
      size: 13,
      bold: true,
      color: { r: 0.06, g: 0.14, b: 0.26 },
      spacingAfter: 4,
    },
    {
      text: `Nombre: ${snap.client.name}`,
      size: 11,
      spacingAfter: 2,
    },
    {
      text: `Empresa: ${normalizeText(snap.client.company) || "N/D"}`,
      size: 11,
      spacingAfter: 2,
    },
    {
      text: `Contacto: ${normalizeText(snap.client.contactName) || "N/D"}`,
      size: 11,
      spacingAfter: 2,
    },
    {
      text: `Email: ${normalizeText(snap.client.email) || "N/D"}`,
      size: 11,
      spacingAfter: 10,
    },
    {
      text: "Emisor",
      size: 13,
      bold: true,
      color: { r: 0.06, g: 0.14, b: 0.26 },
      spacingAfter: 4,
    },
    {
      text: `${snap.issuer.businessName}`,
      size: 11,
      bold: true,
      spacingAfter: 2,
    },
    {
      text: `${snap.issuer.responsibleName} · ${snap.issuer.role}`,
      size: 11,
      spacingAfter: 2,
    },
    {
      text: `${snap.issuer.email}`,
      size: 11,
      spacingAfter: 2,
    },
    {
      text: `${normalizeText(snap.issuer.phone) || ""}`,
      size: 11,
      spacingAfter: 10,
    },
    {
      text: "Secciones",
      size: 13,
      bold: true,
      color: { r: 0.06, g: 0.14, b: 0.26 },
      spacingAfter: 6,
    },
  ];

  for (let index = 0; index < visibleSections.length; index += 1) {
    const section = visibleSections[index];
    lines.push({
      text: `${index + 1}. ${section.title}`,
      size: 12,
      bold: true,
      spacingAfter: 3,
    });

    const sectionContent = splitLines(section.content);
    if (section.kind === "bullets") {
      for (const line of sectionContent) {
        lines.push({
          text: `• ${line.replace(/^[-*•]\s*/, "")}`,
          size: 11,
          spacingAfter: 1,
        });
      }
      lines.push({ text: "", size: 11, spacingAfter: 4 });
    } else {
      lines.push({
        text: section.content || "(Sin contenido)",
        size: 11,
        spacingAfter: 8,
      });
    }
  }

  if (snap.investment.enabled) {
    lines.push({
      text: snap.investment.title || "Inversion",
      size: 13,
      bold: true,
      color: { r: 0.06, g: 0.14, b: 0.26 },
      spacingAfter: 6,
    });

    let subtotal = 0;
    let taxes = 0;

    for (const row of snap.investment.rows) {
      const rowSubtotal = row.quantity * row.unitPrice;
      const rowTax = rowSubtotal * (row.taxRate / 100);
      const rowTotal = rowSubtotal + rowTax;
      subtotal += rowSubtotal;
      taxes += rowTax;

      lines.push({
        text: `${row.concept}: ${row.quantity} x ${formatMoneyWithoutDecimals(row.unitPrice)} (${row.taxRate}%) = ${formatMoneyWithoutDecimals(rowTotal)}`,
        size: 11,
        spacingAfter: 3,
      });
    }

    lines.push(
      {
        text: `Subtotal: ${formatMoneyWithoutDecimals(subtotal)} ${snap.metadata.currency}`,
        size: 11,
        bold: true,
        spacingAfter: 2,
      },
      {
        text: `Impuestos: ${formatMoneyWithoutDecimals(taxes)} ${snap.metadata.currency}`,
        size: 11,
        bold: true,
        spacingAfter: 2,
      },
      {
        text: `Total: ${formatMoneyWithoutDecimals(subtotal + taxes)} ${snap.metadata.currency}`,
        size: 12,
        bold: true,
        spacingAfter: 8,
      },
    );

    if (normalizeText(snap.investment.note)) {
      lines.push({
        text: normalizeText(snap.investment.note),
        size: 11,
        spacingAfter: 8,
      });
    }
  }

  if (normalizeText(snap.closingText)) {
    lines.push(
      {
        text: "Cierre",
        size: 13,
        bold: true,
        color: { r: 0.06, g: 0.14, b: 0.26 },
        spacingAfter: 4,
      },
      {
        text: normalizeText(snap.closingText),
        size: 11,
        spacingAfter: 8,
      },
    );
  }

  if (snap.showSignature) {
    lines.push(
      {
        text: snap.issuer.signatureText || snap.issuer.responsibleName,
        size: 14,
        bold: true,
        spacingAfter: 2,
      },
      {
        text: `${snap.issuer.responsibleName} · ${snap.issuer.role}`,
        size: 11,
        spacingAfter: 2,
      },
      {
        text: snap.issuer.businessName,
        size: 11,
        spacingAfter: 2,
      },
      {
        text: normalizeText(snap.issuer.phone) || "",
        size: 11,
        spacingAfter: 2,
      },
      {
        text: normalizeText(snap.issuer.email) || "",
        size: 11,
      },
    );
  }

  return lines;
};

const readBrandLogo = async (): Promise<Uint8Array | null> => {
  const logoPath = path.join(process.cwd(), "public", "brand", "logo.png");

  try {
    const logoBuffer = await fs.readFile(logoPath);
    return new Uint8Array(logoBuffer);
  } catch {
    return null;
  }
};

const drawHeader = async (
  proposal: Proposal,
  page: PDFDocument["addPage"] extends (...args: never[]) => infer T ? T : never,
  pdfDoc: PDFDocument,
  regularFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  boldFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
): Promise<void> => {
  const snap = proposal.snapshot;

  page.drawRectangle({
    x: 0,
    y: A4_HEIGHT - HEADER_HEIGHT,
    width: A4_WIDTH,
    height: HEADER_HEIGHT,
    color: rgb(0.06, 0.14, 0.26),
  });

  const logoBytes = await readBrandLogo();
  if (logoBytes) {
    try {
      const logo = await pdfDoc.embedPng(logoBytes);
      const logoWidth = 58;
      const logoHeight = (logo.height / logo.width) * logoWidth;
      page.drawImage(logo, {
        x: MARGIN_X,
        y: A4_HEIGHT - 78,
        width: logoWidth,
        height: logoHeight,
      });
    } catch {
      // If the logo cannot be embedded, continue without image.
    }
  }

  const rightColumnWidth = 120;
  const leftStartX = MARGIN_X + 72;
  const leftMaxWidth = A4_WIDTH - leftStartX - MARGIN_X - rightColumnWidth - 16;

  page.drawText("Propuesta comercial", {
    x: leftStartX,
    y: A4_HEIGHT - 44,
    size: 10,
    font: regularFont,
    color: rgb(0.72, 0.89, 1),
  });

  const titleLines = wrapText(
    snap.metadata.title,
    leftMaxWidth,
    (value) => boldFont.widthOfTextAtSize(value, 16),
  ).slice(0, 2);

  let headerCursorY = A4_HEIGHT - 62;
  for (const line of titleLines) {
    page.drawText(line, {
      x: leftStartX,
      y: headerCursorY,
      size: 16,
      font: boldFont,
      color: rgb(1, 1, 1),
    });
    headerCursorY -= 16;
  }

  if (normalizeText(snap.metadata.subtitle)) {
    const subtitleLine = wrapText(
      normalizeText(snap.metadata.subtitle),
      leftMaxWidth,
      (value) => regularFont.widthOfTextAtSize(value, 10),
    )[0];

    page.drawText(subtitleLine, {
      x: leftStartX,
      y: headerCursorY,
      size: 10,
      font: regularFont,
      color: rgb(0.86, 0.91, 0.97),
    });
  }

  const rightX = A4_WIDTH - MARGIN_X - rightColumnWidth;
  page.drawText(new Date(snap.metadata.issueDate).toLocaleDateString("es-CO"), {
    x: rightX,
    y: A4_HEIGHT - 48,
    size: 10,
    font: regularFont,
    color: rgb(0.86, 0.91, 0.97),
  });

  page.drawText(snap.metadata.currency, {
    x: rightX,
    y: A4_HEIGHT - 64,
    size: 10,
    font: regularFont,
    color: rgb(0.86, 0.91, 0.97),
  });

  if (normalizeText(snap.metadata.city)) {
    page.drawText(normalizeText(snap.metadata.city), {
      x: rightX,
      y: A4_HEIGHT - 80,
      size: 10,
      font: regularFont,
      color: rgb(0.86, 0.91, 0.97),
    });
  }
};

const drawFooter = (
  page: PDFDocument["addPage"] extends (...args: never[]) => infer T ? T : never,
  pageNumber: number,
  totalPages: number,
  regularFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
): void => {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: A4_WIDTH,
    height: FOOTER_HEIGHT,
    color: rgb(0.06, 0.14, 0.26),
  });

  page.drawText("JC Engine by Jaime Combita", {
    x: MARGIN_X,
    y: 11,
    size: 9,
    font: regularFont,
    color: rgb(0.86, 0.91, 0.97),
  });

  page.drawText(`Pagina ${pageNumber} de ${totalPages}`, {
    x: A4_WIDTH - MARGIN_X - 88,
    y: 11,
    size: 9,
    font: regularFont,
    color: rgb(0.86, 0.91, 0.97),
  });
};

export const generateProposalPdf = async (proposal: Proposal): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  await drawHeader(proposal, page, pdfDoc, regularFont, boldFont);

  let cursorY = A4_HEIGHT - HEADER_HEIGHT - 20;
  const maxTextWidth = A4_WIDTH - MARGIN_X * 2;
  const lines = buildLines(proposal);

  for (const line of lines) {
    const activeFont = line.bold ? boldFont : regularFont;
    const textSize = line.size;
    const color = line.color ? rgb(line.color.r, line.color.g, line.color.b) : rgb(0.11, 0.16, 0.22);
    const wrappedLines = wrapText(line.text, maxTextWidth, (value) => activeFont.widthOfTextAtSize(value, textSize));

    for (const wrappedLine of wrappedLines) {
      if (cursorY <= MARGIN_BOTTOM) {
        page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
        await drawHeader(proposal, page, pdfDoc, regularFont, boldFont);
        cursorY = A4_HEIGHT - HEADER_HEIGHT - 20;
      }

      page.drawText(wrappedLine, {
        x: MARGIN_X,
        y: cursorY,
        size: textSize,
        font: activeFont,
        color,
      });

      cursorY -= LINE_HEIGHT;
    }

    cursorY -= line.spacingAfter ?? 2;
  }

  const pages = pdfDoc.getPages();
  for (let index = 0; index < pages.length; index += 1) {
    drawFooter(pages[index], index + 1, pages.length, regularFont);
  }

  return pdfDoc.save();
};