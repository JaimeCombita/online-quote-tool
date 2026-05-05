import { Proposal } from "../../domain/entities/Proposal";
import { jcBrandConfig } from "@/modules/shared/branding/brand.config";
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

const toExternalUrl = (value: string): string => {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `https://${value}`;
};

const PAGE_CONTENT_HEIGHT = 680;

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
  const visibleSections = snapshot.sections.filter((section) => section.isVisible);
  const formatter = currencyFormatters[snapshot.metadata.currency];
  const investmentSubtotal = snapshot.investment.rows.reduce(
    (sum, row) => sum + row.quantity * row.unitPrice,
    0,
  );
  const investmentTaxes = snapshot.investment.rows.reduce(
    (sum, row) => sum + row.quantity * row.unitPrice * (row.taxRate / 100),
    0,
  );
  const investmentTotal = investmentSubtotal + investmentTaxes;

  const sectionBlocks: PreviewBlock[] = visibleSections.map((section, index) => {
    const lines = splitLines(section.content);
    const estimatedHeight =
      130 +
      lines.length * (section.kind === "table" ? 28 : 22) +
      (section.kind === "highlight" ? 30 : 0);

    return {
      id: section.id,
      estimatedHeight,
      content: (
        <article className="space-y-4 px-6 py-8 sm:px-10">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {index + 1}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{section.title}</h3>
            </div>
          </div>

          {section.kind === "bullets" && (
            <ul className="space-y-2 pl-14 text-sm leading-7 text-slate-700">
              {lines.map((line) => (
                <li key={`${section.id}-${line}`} className="list-disc">
                  {line.replace(/^[-*•]\s*/, "")}
                </li>
              ))}
            </ul>
          )}

          {section.kind === "highlight" && (
            <div className="ml-14 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm leading-7 text-slate-700">
              {lines.length > 0 ? lines.map((line) => <p key={`${section.id}-${line}`}>{line}</p>) : <p>{section.content}</p>}
            </div>
          )}

          {section.kind === "table" && (
            <div className="ml-14 overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full border-collapse text-left text-sm text-slate-700">
                {(() => {
                  const parsedRows = lines
                    .map((line) => line.split("|").map((cell) => cell.trim()))
                    .filter((row) => row.length > 0);
                  const header = parsedRows[0] ?? [];
                  const body = parsedRows.slice(1);

                  return (
                    <>
                      {header.length > 0 && (
                        <thead>
                          <tr className="bg-sky-300">
                            {header.map((cell, cellIndex) => (
                              <th key={`${section.id}-header-${cellIndex}`} className="border border-slate-300 px-4 py-3 font-semibold text-slate-900">
                                {cell}
                              </th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {body.length > 0 ? (
                          body.map((row, rowIndex) => (
                            <tr key={`${section.id}-row-${rowIndex}`} className={rowIndex % 2 === 0 ? "bg-sky-50" : "bg-white"}>
                              {row.map((cell, cellIndex) => (
                                <td key={`${section.id}-${rowIndex}-${cellIndex}`} className="border border-slate-300 px-4 py-3 align-top">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr className="bg-white">
                            <td className="border border-slate-300 px-4 py-3 text-slate-500">Sin filas en la tabla</td>
                          </tr>
                        )}
                      </tbody>
                    </>
                  );
                })()}
              </table>
            </div>
          )}

          {(section.kind === "text" || section.kind === "investment") && (
            <div className="ml-14 space-y-3 text-sm leading-7 text-slate-700">
              {lines.length > 0 ? lines.map((line) => <p key={`${section.id}-${line}`}>{line}</p>) : <p>{section.content}</p>}
            </div>
          )}
        </article>
      ),
    };
  });

  const baseBlocks: PreviewBlock[] = [
    {
      id: "cover",
      estimatedHeight: 320,
      content: (
        <>
          <div className="grid gap-0 border-b border-slate-200 sm:grid-cols-2">
            <div className="border-b border-slate-200 px-6 py-6 sm:border-b-0 sm:border-r sm:px-10">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Cliente</p>
              <h3 className="mt-3 text-xl font-semibold text-slate-900">{snapshot.client.name}</h3>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                {snapshot.client.company && <p>{snapshot.client.company}</p>}
                {snapshot.client.contactName && <p>{snapshot.client.contactName}</p>}
                {snapshot.client.email && <p>{snapshot.client.email}</p>}
              </div>
            </div>

            <div className="px-6 py-6 sm:px-10">
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
    const investmentNoteLines = splitLines(snapshot.investment.note ?? "").length;
    baseBlocks.push({
      id: "investment",
      estimatedHeight: 260 + snapshot.investment.rows.length * 42 + investmentNoteLines * 20,
      content: (
        <section className="space-y-5 px-6 py-8 sm:px-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900">{snapshot.investment.title}</h3>
            </div>
            <div>
              <p className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-800">
                Vigencia de la oferta: {snapshot.investment.offerValidityDays ?? 30} dias calendario
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full border-collapse text-left text-sm text-slate-700">
              <thead className="bg-sky-300 text-slate-900">
                <tr>
                  <th className="border border-slate-300 px-4 py-3 font-semibold">Concepto</th>
                  <th className="border border-slate-300 px-4 py-3 font-semibold">Descripcion</th>
                  <th className="border border-slate-300 px-4 py-3 font-semibold">Cantidad</th>
                  <th className="border border-slate-300 px-4 py-3 font-semibold">Unitario</th>
                  <th className="border border-slate-300 px-4 py-3 font-semibold">Impuesto</th>
                  <th className="border border-slate-300 px-4 py-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.investment.rows.map((row, rowIndex) => {
                  const rowSubtotal = row.quantity * row.unitPrice;
                  const rowTotal = rowSubtotal + rowSubtotal * (row.taxRate / 100);

                  return (
                    <tr key={row.id} className={rowIndex % 2 === 0 ? "bg-sky-50" : "bg-white"}>
                      <td className="border border-slate-300 px-4 py-3 font-medium text-slate-900">{row.concept}</td>
                      <td className="border border-slate-300 px-4 py-3">{row.description}</td>
                      <td className="border border-slate-300 px-4 py-3">{row.quantity}</td>
                      <td className="border border-slate-300 px-4 py-3">{formatter.format(row.unitPrice)}</td>
                      <td className="border border-slate-300 px-4 py-3">{row.taxRate}%</td>
                      <td className="border border-slate-300 px-4 py-3">{formatter.format(rowTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <p className="text-slate-500">Subtotal</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{formatter.format(investmentSubtotal)}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <p className="text-slate-500">Impuestos</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{formatter.format(investmentTaxes)}</p>
            </div>
            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
              <p className="text-slate-300">Total</p>
              <p className="mt-1 text-lg font-semibold">{formatter.format(investmentTotal)}</p>
            </div>
          </div>

          {snapshot.investment.note && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
              {splitLines(snapshot.investment.note).map((line) => (
                <p key={`investment-note-${line}`}>{line}</p>
              ))}
            </div>
          )}
        </section>
      ),
    });
  }

  if (snapshot.closingText) {
    const closingLines = splitLines(snapshot.closingText);
    baseBlocks.push({
      id: "closing",
      estimatedHeight: 120 + closingLines.length * 22,
      content: (
        <section className="space-y-4 px-6 py-8 sm:px-10">
          <h3 className="text-lg font-semibold text-slate-900">Cierre</h3>
          <div className="space-y-3 text-sm leading-7 text-slate-700">
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
          <div className="px-6 pt-8 pb-4 text-center sm:px-10">
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
    if (blockWillOverflow && currentPage.blocks.length > 0) {
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
    <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
        <div className="max-h-[78vh] overflow-y-auto px-0">
          <div className="space-y-8" ref={pagesContainerRef}>
        {previewPages.map((page, index) => (
          <div
            key={page.id}
            data-preview-page="true"
            className={`mx-auto w-full max-w-[595px] overflow-hidden border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)] ${styles.previewPage}`}
          >
            <div
              className={`border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.18),_transparent_38%),linear-gradient(135deg,#0f172a,#1e293b)] px-6 py-6 text-white ${styles.previewHeader}`}
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={snapshot.issuer.logoUrl || jcBrandConfig.assets.logoMain}
                      alt={`${jcBrandConfig.app.name} logo`}
                      className="h-11 w-11 rounded-xl border border-white/20 bg-white/10 object-contain p-1"
                    />
                    <p className="text-xs uppercase tracking-[0.35em] text-sky-200">{page.title}</p>
                  </div>
                  <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
                    {snapshot.metadata.title}
                  </h2>
                  {snapshot.metadata.subtitle && (
                    <p className="mt-3 max-w-2xl text-sm text-slate-200 sm:text-base">
                      {snapshot.metadata.subtitle}
                    </p>
                  )}
                </div>

                <div className="grid gap-2 text-sm text-slate-200 sm:text-right">
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
              {page.signatureBlock && <div className="mt-auto mb-[30px]">{page.signatureBlock.content}</div>}
            </div>

            <div
              className={`border-t border-slate-200 bg-[linear-gradient(135deg,#0f172a,#1e293b)] px-6 text-xs text-slate-200 ${styles.previewFooter}`}
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