import { Proposal } from "../../domain/entities/Proposal";
import { jcBrandConfig } from "@/modules/shared/branding/brand.config";
import { loadCompanySettings } from "../../infrastructure/browser/companySettings";
import signatureFontStyles from "../styles/SignatureFonts.module.css";
import styles from "./ProposalHtmlPreview.module.css";

interface ProposalHtmlPreviewProps {
  proposal: Proposal;
  pagesContainerRef?: React.RefObject<HTMLDivElement | null>;
}

const currencyFormatters = {
  COP: new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }),
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }),
};

const signatureFontClassByValue: Record<string, string> = {
  "script-elegant": "scriptElegant",
  "script-formal": "scriptFormal",
  "script-hand": "scriptHand",
  "serif-classic": "serifClassic",
  "sans-clean": "sansClean",
  "modern-sign": "modernSign",
};

const splitLines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const parseTextLineStyle = (line: string): { text: string; isSubtitle: boolean } => {
  const subtitleMatch = line.match(/^\*\*(.+)\*\*$/);
  if (!subtitleMatch) {
    return { text: line, isSubtitle: false };
  }

  return {
    text: subtitleMatch[1].trim(),
    isSubtitle: true,
  };
};

const toExternalUrl = (value: string): string => {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `https://${value}`;
};

const PAGE_CONTENT_HEIGHT = 680;

const MAX_LINES_PER_BLOCK_BY_KIND = {
  text: 14,
  bullets: 16,
  highlight: 12,
  investment: 14,
  table: 12,
} as const;

const chunkArray = <T,>(items: T[], chunkSize: number): T[][] => {
  if (items.length === 0) {
    return [[]];
  }

  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
};

type PreviewBlock = {
  id: string;
  estimatedHeight: number;
  content: React.ReactNode;
};

type PreviewPage = {
  id: string;
  title: string;
  blocks: PreviewBlock[];
  signatureBlock?: PreviewBlock;
};

export function ProposalHtmlPreview({ proposal, pagesContainerRef }: ProposalHtmlPreviewProps) {
  const snapshot = proposal.snapshot;
  const companySettingsLogoUrl = typeof window === "undefined" ? "" : loadCompanySettings()?.logoUrl ?? "";
  const issuerLogoUrl = snapshot.issuer.logoUrl || companySettingsLogoUrl || jcBrandConfig.assets.logoMain;
  const visibleSections = snapshot.sections.filter((section) => section.isVisible);
  const formatter = currencyFormatters[snapshot.metadata.currency];
  const investmentSubtotal = snapshot.investment.rows.reduce(
    (sum, row) => sum + row.quantity * row.unitPrice,
    0,
  );
  const hasTaxInInvestmentRows = snapshot.investment.rows.some((row) => row.taxRate > 0);
  const shouldShowInvestmentTotals = (snapshot.investment.showTotals ?? true) === true;
  const investmentTaxes = snapshot.investment.rows.reduce(
    (sum, row) => sum + row.quantity * row.unitPrice * (row.taxRate / 100),
    0,
  );
  const investmentTotal = investmentSubtotal + investmentTaxes;

  const sectionBlocks: PreviewBlock[] = visibleSections.flatMap((section, index) => {
    const lines = splitLines(section.content);
    const parsedRows = lines
      .map((line) => line.split("|").map((cell) => cell.trim()))
      .filter((row) => row.length > 0);
    const tableHeader = parsedRows[0] ?? [];
    const tableBody = parsedRows.slice(1);

    const lineChunks = chunkArray(
      lines.length > 0 ? lines : [section.content],
      MAX_LINES_PER_BLOCK_BY_KIND[section.kind],
    );
    const tableBodyChunks = section.kind === "table"
      ? chunkArray(tableBody, MAX_LINES_PER_BLOCK_BY_KIND.table)
      : [];

    const chunkCount = section.kind === "table" ? Math.max(1, tableBodyChunks.length) : lineChunks.length;

    return Array.from({ length: chunkCount }, (_, chunkIndex) => {
      const contentLines = section.kind === "table" ? [] : lineChunks[chunkIndex] ?? [];
      const contentRows = section.kind === "table" ? tableBodyChunks[chunkIndex] ?? [] : [];
      const isContinuation = chunkIndex > 0;

      let estimatedHeight = 58;
      if (section.kind === "table") {
        estimatedHeight += 26 + contentRows.length * 24;
      } else if (section.kind === "highlight") {
        estimatedHeight += 22 + contentLines.length * 28;
      } else if (section.kind === "bullets") {
        estimatedHeight += contentLines.length * 24;
      } else {
        estimatedHeight += contentLines.length * 28;
      }

      return {
        id: `${section.id}-${chunkIndex + 1}`,
        estimatedHeight,
        content: (
          <article className="space-y-3 px-5 py-6 sm:px-8">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                {index + 1}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {section.title}
                  {isContinuation && <span className="ml-2 text-sm text-slate-500">(continua)</span>}
                </h3>
              </div>
            </div>

            {section.kind === "bullets" && (
              <ul className="space-y-1 pl-10 text-sm leading-6 text-slate-700">
                {contentLines.map((line, lineIndex) => (
                  <li key={`${section.id}-${chunkIndex}-${lineIndex}`} className="list-disc">
                    {line.replace(/^[-*•]\s*/, "")}
                  </li>
                ))}
              </ul>
            )}

            {section.kind === "highlight" && (
              <div className="ml-10 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-slate-700">
                {contentLines.map((line, lineIndex) => <p key={`${section.id}-${chunkIndex}-${lineIndex}`}>{line}</p>)}
              </div>
            )}

            {section.kind === "table" && (
              <div className="ml-10 overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full border-collapse text-left text-sm text-slate-700">
                  {tableHeader.length > 0 && (
                    <thead>
                      <tr className="bg-sky-300">
                        {tableHeader.map((cell, cellIndex) => (
                          <th key={`${section.id}-header-${cellIndex}`} className="border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900">
                            {cell}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {contentRows.length > 0 ? (
                      contentRows.map((row, rowIndex) => (
                        <tr key={`${section.id}-${chunkIndex}-row-${rowIndex}`} className={rowIndex % 2 === 0 ? "bg-sky-50" : "bg-white"}>
                          {row.map((cell, cellIndex) => (
                            <td key={`${section.id}-${chunkIndex}-${rowIndex}-${cellIndex}`} className="border border-slate-300 px-3 py-2 text-xs align-top">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr className="bg-white">
                        <td className="border border-slate-300 px-3 py-2 text-xs text-slate-500">Sin filas en la tabla</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {section.kind === "text" && (
              <div className="ml-10 space-y-2 text-sm leading-6 text-slate-700">
                {contentLines.map((line, lineIndex) => {
                  const parsedLine = parseTextLineStyle(line);
                  return (
                    <p
                      key={`${section.id}-${chunkIndex}-${lineIndex}`}
                      className={parsedLine.isSubtitle ? "font-semibold text-sky-700" : undefined}
                    >
                      {parsedLine.text}
                    </p>
                  );
                })}
              </div>
            )}

            {section.kind === "investment" && (
              <div className="ml-10 space-y-2 text-sm leading-6 text-slate-700">
                {contentLines.map((line, lineIndex) => <p key={`${section.id}-${chunkIndex}-${lineIndex}`}>{line}</p>)}
              </div>
            )}
          </article>
        ),
      };
    });
  });

  const baseBlocks: PreviewBlock[] = [
    {
      id: "cover",
      estimatedHeight: 320,
      content: (
        <>
          <div className="grid gap-0 border-b border-slate-200 sm:grid-cols-2">
            <div className="border-b border-slate-200 px-5 py-5 sm:border-b-0 sm:border-r sm:px-8">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Cliente</p>
              <h3 className="mt-3 text-xl font-semibold text-slate-900">{snapshot.client.name}</h3>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                {snapshot.client.company && <p>{snapshot.client.company}</p>}
                {snapshot.client.contactName && <p>{snapshot.client.contactName}</p>}
                {snapshot.client.email && <p>{snapshot.client.email}</p>}
              </div>
            </div>

            <div className="px-5 py-5 sm:px-8">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Emisor</p>
              <h3 className="mt-3 text-xl font-semibold text-slate-900">
                {snapshot.issuer.businessName}
              </h3>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p>
                  {snapshot.issuer.responsibleName} · {snapshot.issuer.role}
                </p>
                <p>{snapshot.issuer.email}</p>
                {snapshot.issuer.phone && <p>{snapshot.issuer.phone}</p>}
                {snapshot.issuer.website && (
                  <p>
                    <a
                      href={toExternalUrl(snapshot.issuer.website)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-700 underline"
                    >
                      {snapshot.issuer.website}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      ),
    },
    ...sectionBlocks,
  ];

  if (snapshot.investment.enabled) {
    const investmentNoteLines = splitLines(snapshot.investment.note ?? "");
    const investmentRowChunks = chunkArray(snapshot.investment.rows, 10);

    investmentRowChunks.forEach((rowsChunk, chunkIndex) => {
      const isFirstChunk = chunkIndex === 0;
      const isLastChunk = chunkIndex === investmentRowChunks.length - 1;
      const estimatedHeight =
        (isFirstChunk ? 90 : 36) +
        rowsChunk.length * 28 +
        (isLastChunk && shouldShowInvestmentTotals ? 84 : 0) +
        (isLastChunk && investmentNoteLines.length > 0 ? 30 + investmentNoteLines.length * 18 : 0);

      baseBlocks.push({
        id: `investment-${chunkIndex + 1}`,
        estimatedHeight,
        content: (
          <section className="space-y-3 px-5 py-6 sm:px-8">
            {isFirstChunk && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{snapshot.investment.title}</h3>
                </div>
                <div>
                  <p className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-800">
                    Vigencia de la oferta: {snapshot.investment.offerValidityDays ?? 30} dias calendario
                  </p>
                </div>
              </div>
            )}

            {!isFirstChunk && (
              <h3 className="text-xl font-semibold text-slate-900">
                {snapshot.investment.title}
                <span className="ml-2 text-sm text-slate-500">(continua)</span>
              </h3>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-full border-collapse text-left text-sm text-slate-700">
                <thead className="bg-sky-300 text-slate-900">
                  <tr>
                    <th className="border border-slate-300 px-3 py-2 text-xs font-semibold">Concepto</th>
                    <th className="border border-slate-300 px-3 py-2 text-xs font-semibold">Descripcion</th>
                    <th className="border border-slate-300 px-3 py-2 text-xs font-semibold">Cantidad</th>
                    <th className="border border-slate-300 px-3 py-2 text-xs font-semibold">Unitario</th>
                    {hasTaxInInvestmentRows && (
                      <th className="border border-slate-300 px-3 py-2 text-xs font-semibold">Impuesto</th>
                    )}
                    <th className="border border-slate-300 px-3 py-2 text-xs font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rowsChunk.length > 0 ? (
                    rowsChunk.map((row, rowIndex) => {
                      const rowSubtotal = row.quantity * row.unitPrice;
                      const rowTotal = rowSubtotal + rowSubtotal * (row.taxRate / 100);

                      return (
                        <tr key={row.id} className={rowIndex % 2 === 0 ? "bg-sky-50" : "bg-white"}>
                          <td className="border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900">{row.concept}</td>
                          <td className="border border-slate-300 px-3 py-2 text-xs">{row.description}</td>
                          <td className="border border-slate-300 px-3 py-2 text-xs">{row.quantity}</td>
                          <td className="border border-slate-300 px-3 py-2 text-xs">{formatter.format(row.unitPrice)}</td>
                          {hasTaxInInvestmentRows && (
                            <td className="border border-slate-300 px-3 py-2 text-xs">{row.taxRate}%</td>
                          )}
                          <td className="border border-slate-300 px-3 py-2 text-xs">{formatter.format(rowTotal)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr className="bg-white">
                      <td className="border border-slate-300 px-3 py-2 text-xs text-slate-500" colSpan={hasTaxInInvestmentRows ? 6 : 5}>
                        Sin filas en la inversion
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {isLastChunk && shouldShowInvestmentTotals && (
              <div className={`grid gap-2 text-xs ${hasTaxInInvestmentRows ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                  <p className="text-slate-500">Subtotal</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{formatter.format(investmentSubtotal)}</p>
                </div>
                {hasTaxInInvestmentRows && (
                  <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                    <p className="text-slate-500">Impuestos</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{formatter.format(investmentTaxes)}</p>
                  </div>
                )}
                <div className="rounded-2xl bg-slate-900 px-3 py-2 text-white">
                  <p className="text-slate-300">Total</p>
                  <p className="mt-1 text-base font-semibold">{formatter.format(investmentTotal)}</p>
                </div>
              </div>
            )}

            {isLastChunk && snapshot.investment.note && (
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-700">
                {investmentNoteLines.map((line, lineIndex) => (
                  <p key={`investment-note-${lineIndex}`}>{line}</p>
                ))}
              </div>
            )}
          </section>
        ),
      });
    });
  }

  if (snapshot.closingText) {
    const closingLines = splitLines(snapshot.closingText);
    baseBlocks.push({
      id: "closing",
      estimatedHeight: 90 + closingLines.length * 29,
      content: (
        <section className="space-y-3 px-5 py-6 sm:px-8">
          <h3 className="text-lg font-semibold text-slate-900">Cierre</h3>
          <div className="space-y-2 text-sm leading-6 text-slate-700">
            {closingLines.map((line) => (
              <p key={`closing-${line}`}>{line}</p>
            ))}
          </div>
        </section>
      ),
    });
  }

  const signatureBlock: PreviewBlock | undefined = snapshot.showSignature
    ? {
        id: "signature",
        estimatedHeight: 210,
        content: (
          <div className="px-5 pt-6 pb-3 text-center sm:px-8">
            <div className="inline-block">
              <p
                className={`text-3xl text-slate-900 ${
                  signatureFontStyles[signatureFontClassByValue[snapshot.issuer.signatureFont]]
                }`}
              >
                {snapshot.issuer.signatureText}
              </p>
              <div className={`mt-2 h-px bg-slate-400 ${styles.signatureDivider}`} />
            </div>
            <p className="mt-2 text-sm font-medium text-slate-900">{snapshot.issuer.responsibleName}</p>
            <p className="text-sm text-slate-500">{snapshot.issuer.role}</p>
            {snapshot.issuer.phone && <p className="text-sm text-slate-500">{snapshot.issuer.phone}</p>}
            <p className="text-sm text-slate-500">{snapshot.issuer.email}</p>
          </div>
        ),
      }
    : undefined;

  const previewPages: PreviewPage[] = [];
  let currentPage: PreviewPage = {
    id: "page-1",
    title: "Propuesta comercial",
    blocks: [],
  };
  let usedHeight = 0;

  for (const block of baseBlocks) {
    const blockWillOverflow = usedHeight + block.estimatedHeight > PAGE_CONTENT_HEIGHT;
    
    // If block doesn't fit and current page has content, start a new page
    // UNLESS the block is so large it won't fit on any page - then force it anyway
    if (blockWillOverflow && currentPage.blocks.length > 0) {
      // Only push current page if it's not empty
      previewPages.push(currentPage);
      currentPage = {
        id: `page-${previewPages.length + 1}`,
        title: "Propuesta comercial",
        blocks: [],
      };
      usedHeight = 0;
    }

    currentPage.blocks.push(block);
    usedHeight += block.estimatedHeight;
  }

  if (currentPage.blocks.length > 0 || previewPages.length === 0) {
    previewPages.push(currentPage);
  }

  if (signatureBlock) {
    const lastPage = previewPages[previewPages.length - 1];
    const lastPageHeight = lastPage.blocks.reduce((sum, block) => sum + block.estimatedHeight, 0);
    const signatureFits = lastPageHeight + signatureBlock.estimatedHeight <= PAGE_CONTENT_HEIGHT;

    if (signatureFits) {
      lastPage.signatureBlock = signatureBlock;
    } else {
      previewPages.push({
        id: `page-${previewPages.length + 1}`,
        title: "Firma",
        blocks: [],
        signatureBlock,
      });
    }
  }

  const totalPages = previewPages.length;

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm sm:p-6">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-2 sm:p-3">
        <div className="max-h-[78vh] overflow-y-auto px-0">
          <div className="space-y-6" ref={pagesContainerRef}>
        {previewPages.map((page, index) => (
          <div
            key={page.id}
            data-preview-page="true"
            className={`mx-auto w-full max-w-[595px] overflow-hidden border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)] ${styles.previewPage}`}
          >
            <div
              className={`border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.18),_transparent_38%),linear-gradient(135deg,#0f172a,#1e293b)] px-5 py-5 text-white ${styles.previewHeader}`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={issuerLogoUrl}
                      alt={`${jcBrandConfig.app.name} logo`}
                      className="h-11 w-11 rounded-xl border border-white/20 bg-white/10 object-contain p-1"
                    />
                    <p className="text-xs uppercase tracking-[0.35em] text-sky-200">{page.title}</p>
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">
                    {snapshot.metadata.title}
                  </h2>
                  {snapshot.metadata.subtitle && (
                    <p className="mt-2 max-w-2xl text-sm text-slate-200">
                      {snapshot.metadata.subtitle}
                    </p>
                  )}
                </div>

                <div className="grid gap-1 text-xs text-slate-200 sm:text-right">
                  <p>{new Date(snapshot.metadata.issueDate).toLocaleDateString()}</p>
                  {snapshot.metadata.city && <p>{snapshot.metadata.city}</p>}
                  <p>{snapshot.metadata.currency}</p>
                </div>
              </div>
            </div>

            <div
              className={`flex flex-col overflow-hidden ${styles.previewBody}`}
            >
              {page.blocks.map((block) => (
                <div key={block.id}>{block.content}</div>
              ))}
              {page.signatureBlock && <div className="mt-auto mb-4">{page.signatureBlock.content}</div>}
            </div>

            <div
              className={`border-t border-slate-200 bg-[linear-gradient(135deg,#0f172a,#1e293b)] px-5 text-xs text-slate-200 ${styles.previewFooter}`}
            >
              <div className="flex items-center justify-between">
                <p>{jcBrandConfig.app.legalName}</p>
                <p>
                  Pagina {index + 1} de {totalPages}
                </p>
              </div>
            </div>
          </div>
        ))}
          </div>
        </div>
      </div>
    </section>
  );
}