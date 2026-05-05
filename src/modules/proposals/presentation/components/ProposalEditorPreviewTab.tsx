import { MutableRefObject } from "react";
import { Proposal, ProposalPdfValidationResult } from "../../domain/entities/Proposal";
import { ProposalHtmlPreview } from "./ProposalHtmlPreview";

interface ProposalEditorPreviewTabProps {
  proposal: Proposal;
  pdfValidation: ProposalPdfValidationResult;
  previewPagesContainerRef: MutableRefObject<HTMLDivElement | null>;
  isGeneratingPdf: boolean;
  isEmailPanelOpen: boolean;
  isSendingEmail: boolean;
  recipientEmail: string;
  emailSubject: string;
  emailMessage: string;
  onToggleEmailPanel: () => void;
  onRecipientEmailChange: (value: string) => void;
  onEmailSubjectChange: (value: string) => void;
  onEmailMessageChange: (value: string) => void;
  onGeneratePdf: () => Promise<void>;
  onSendEmail: () => Promise<void>;
}

export function ProposalEditorPreviewTab({
  proposal,
  pdfValidation,
  previewPagesContainerRef,
  isGeneratingPdf,
  isEmailPanelOpen,
  isSendingEmail,
  recipientEmail,
  emailSubject,
  emailMessage,
  onToggleEmailPanel,
  onRecipientEmailChange,
  onEmailSubjectChange,
  onEmailMessageChange,
  onGeneratePdf,
  onSendEmail,
}: ProposalEditorPreviewTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm text-slate-700">
          El PDF se genera al momento de solicitarlo y no se guarda en almacenamiento local.
        </p>
        <button
          type="button"
          onClick={() => {
            void onGeneratePdf();
          }}
          disabled={!pdfValidation.isValid || isGeneratingPdf}
          className="inline-flex items-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGeneratingPdf ? "Generando PDF..." : "Generar PDF ahora"}
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <button
          type="button"
          onClick={onToggleEmailPanel}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Enviar propuesta por email</h3>
            <p className="text-sm text-slate-600">
              El adjunto PDF se genera bajo demanda en el momento del envio y no se almacena.
            </p>
          </div>
          <span className="text-slate-500">{isEmailPanelOpen ? "▲" : "▼"}</span>
        </button>

        {isEmailPanelOpen && (
          <div className="space-y-4 border-t border-slate-200 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Destinatario</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(event) => onRecipientEmailChange(event.target.value)}
                  className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="cliente@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Asunto</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(event) => onEmailSubjectChange(event.target.value)}
                  className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Mensaje</label>
              <textarea
                value={emailMessage}
                onChange={(event) => onEmailMessageChange(event.target.value)}
                rows={7}
                className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  void onSendEmail();
                }}
                disabled={!pdfValidation.isValid || isSendingEmail}
                className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSendingEmail ? "Enviando..." : "Enviar por email"}
              </button>
            </div>
          </div>
        )}
      </div>

      <ProposalHtmlPreview proposal={proposal} pagesContainerRef={previewPagesContainerRef} />
    </div>
  );
}
