import Link from "next/link";
import { Proposal } from "../../domain/entities/Proposal";
import { ProposalPdfReadinessPanel } from "./ProposalPdfReadinessPanel";

interface ProposalDraftCardProps {
  draft: Proposal;
  onExport: (proposalId: string) => void;
  onDelete: (proposalId: string) => void;
  onSendWp: (draft: Proposal) => void;
}

export function ProposalDraftCard({ draft, onExport, onDelete, onSendWp }: ProposalDraftCardProps) {
  const snap = draft.snapshot;
  const pdfValidation = draft.validateForPdf();

  const issueDate = new Date(snap.metadata.issueDate);
  const today = new Date();
  const daysSinceIssue = Math.floor((today.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
  const offerValidityDays = snap.investment.offerValidityDays ?? 30;
  const daysRemaining = offerValidityDays - daysSinceIssue;
  const isOfferExpired = daysRemaining <= 0;
  const hasClientPhone = Boolean(snap.client.phone?.trim());

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
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
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href={`/editor/${snap.id}`}
            className="inline-flex items-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800"
          >
            Editar
          </Link>
          {hasClientPhone && (
            <button
              type="button"
              onClick={() => onSendWp(draft)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
              aria-label="Enviar por WhatsApp"
              title="Enviar propuesta por WhatsApp"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/50 text-[11px] font-bold">WP</span>
              WhatsApp
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onExport(snap.id);
            }}
            className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Exportar JSON
          </button>
          <button
            onClick={() => onDelete(snap.id)}
            className="inline-flex items-center rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
