import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Proposal } from "../../domain/entities/Proposal";
import { ProposalPdfReadinessPanel } from "./ProposalPdfReadinessPanel";

interface ProposalDraftCardProps {
  draft: Proposal;
  onExport: (draft: Proposal) => void;
  onDelete: (proposalId: string) => void;
  onSendWp: (draft: Proposal) => void;
}

export function ProposalDraftCard({ draft, onExport, onDelete, onSendWp }: ProposalDraftCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const snap = draft.snapshot;
  const pdfValidation = draft.validateForPdf();

  const issueDate = new Date(snap.metadata.issueDate);
  const today = new Date();
  const daysSinceIssue = Math.floor((today.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
  const offerValidityDays = snap.investment.offerValidityDays ?? 30;
  const daysRemaining = offerValidityDays - daysSinceIssue;
  const isOfferExpired = daysRemaining <= 0;
  const hasClientPhone = Boolean(snap.client.phone?.trim());
  const hasClientGeneralInfo = Boolean(
    snap.client.name.trim() ||
      snap.client.company?.trim() ||
      snap.client.contactName?.trim() ||
      snap.client.phone.trim() ||
      snap.client.email.trim(),
  );

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <Link href={`/editor/${snap.id}`} className="flex-1 min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-900">{snap.metadata.title}</h3>
            <ProposalPdfReadinessPanel compact={true} validation={pdfValidation} />
          </div>
          {snap.metadata.subtitle && (
            <p className="mt-1 text-sm text-slate-600">{snap.metadata.subtitle}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
            <p>
              <strong>Cliente:</strong> {snap.client.name}
            </p>
            {snap.client.company && (
              <p>
                <strong>Empresa:</strong> {snap.client.company}
              </p>
            )}
            <p>
              <strong>Fecha:</strong> {new Date(snap.metadata.issueDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Secciones:</strong> {snap.sections.length}
            </p>
            {snap.investment.enabled && (
              <p className={isOfferExpired ? "text-red-600" : "text-amber-600"}>
                <strong>Vigencia:</strong> {isOfferExpired ? "Expirada" : `${daysRemaining} dias restantes`}
              </p>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Actualizado: {new Date(snap.updatedAt).toLocaleString()}
          </p>
        </Link>

        <div className="flex shrink-0 flex-col gap-2">
          <div className="hidden gap-2 md:flex md:flex-col">
            <Link
              href={`/editor/${snap.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800"
            >
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 17.25V21h3.75L19.81 7.94l-3.75-3.75L3 17.25z" />
              </svg>
              Editar
            </Link>

            {hasClientPhone && (
              <button
                type="button"
                onClick={() => onSendWp(draft)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                aria-label="Contactar por WhatsApp"
                title="Contactar por WhatsApp"
              >
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16 .6C7.5.6.6 7.5.6 16c0 2.8.8 5.5 2.2 7.9L.6 31.4l7.7-2.1c2.3 1.2 4.9 1.9 7.7 1.9 8.5 0 15.4-6.9 15.4-15.4S24.5.6 16 .6zm0 28c-2.4 0-4.7-.7-6.7-1.9l-.5-.3-4.6 1.2 1.2-4.5-.3-.5C4 20.7 3.3 18.4 3.3 16 3.3 8.9 8.9 3.3 16 3.3S28.7 8.9 28.7 16 23.1 28.7 16 28.7zm7-9.4c-.4-.2-2.4-1.2-2.8-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.2 1.5-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8.2-.2.4-.4.6-.7.2-.2.3-.4.4-.6.1-.2 0-.5 0-.7 0-.2-.9-2.2-1.2-3-.3-.7-.6-.6-.9-.6h-.7c-.2 0-.6.1-.9.5-.3.4-1.2 1.2-1.2 3s1.2 3.6 1.4 3.8c.2.2 2.4 3.8 5.9 5.2.8.4 1.5.6 2 .7.8.2 1.6.2 2.2.1.7-.1 2.4-1 2.7-2 .3-1 .3-1.8.2-2-.1-.2-.4-.3-.8-.5z" />
                </svg>
                Contactar
              </button>
            )}

            {hasClientGeneralInfo && (
              <button
                type="button"
                onClick={() => {
                  onExport(draft);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
                Exportar
              </button>
            )}

            <button
              onClick={() => onDelete(snap.id)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
            >
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
              </svg>
              Eliminar
            </button>
          </div>

          <div ref={menuRef} className="relative md:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="5" cy="12" r="1" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
              </svg>
              Acciones
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 z-20 mt-2 min-w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                <Link
                  href={`/editor/${snap.id}`}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 17.25V21h3.75L19.81 7.94l-3.75-3.75L3 17.25z" />
                  </svg>
                  Editar
                </Link>

                {hasClientPhone && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onSendWp(draft);
                    }}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <svg aria-hidden="true" className="h-4 w-4 text-emerald-600" viewBox="0 0 32 32" fill="currentColor">
                      <path d="M16 .6C7.5.6.6 7.5.6 16c0 2.8.8 5.5 2.2 7.9L.6 31.4l7.7-2.1c2.3 1.2 4.9 1.9 7.7 1.9 8.5 0 15.4-6.9 15.4-15.4S24.5.6 16 .6zm0 28c-2.4 0-4.7-.7-6.7-1.9l-.5-.3-4.6 1.2 1.2-4.5-.3-.5C4 20.7 3.3 18.4 3.3 16 3.3 8.9 8.9 3.3 16 3.3S28.7 8.9 28.7 16 23.1 28.7 16 28.7zm7-9.4c-.4-.2-2.4-1.2-2.8-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.2 1.5-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8.2-.2.4-.4.6-.7.2-.2.3-.4.4-.6.1-.2 0-.5 0-.7 0-.2-.9-2.2-1.2-3-.3-.7-.6-.6-.9-.6h-.7c-.2 0-.6.1-.9.5-.3.4-1.2 1.2-1.2 3s1.2 3.6 1.4 3.8c.2.2 2.4 3.8 5.9 5.2.8.4 1.5.6 2 .7.8.2 1.6.2 2.2.1.7-.1 2.4-1 2.7-2 .3-1 .3-1.8.2-2-.1-.2-.4-.3-.8-.5z" />
                    </svg>
                    Contactar
                  </button>
                )}

                {hasClientGeneralInfo && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onExport(draft);
                    }}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3v12" />
                      <path d="m7 10 5 5 5-5" />
                      <path d="M5 21h14" />
                    </svg>
                    Exportar
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDelete(snap.id);
                  }}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 14H6L5 6" />
                  </svg>
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
