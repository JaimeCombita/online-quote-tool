"use client";

import { useCallback, useMemo, useState } from "react";
import { useProposalDashboardController } from "../hooks/useProposalDashboardController";
import { IssuerForm } from "./IssuerForm";
import { BlockingLoaderOverlay } from "../../../shared/presentation/components/BlockingLoaderOverlay";
import { ProposalDraftCard } from "./ProposalDraftCard";
import { ConfirmationDialog } from "../../../shared/presentation/components/ConfirmationDialog";

export function ProposalDashboard() {
  const [draftIdPendingDelete, setDraftIdPendingDelete] = useState<string | null>(null);
  const [hasUnsavedCompanySettings, setHasUnsavedCompanySettings] = useState(false);
  const [isCloseCompanySettingsConfirmOpen, setIsCloseCompanySettingsConfirmOpen] = useState(false);
  const {
    drafts,
    isLoading,
    error,
    creatingNew,
    isCompanySettingsOpen,
    setIsCompanySettingsOpen,
    blockingMessage,
    companySettings,
    companySettingsImportInputRef,
    importJsonInputRef,
    handleCreateNew,
    handleCompanySettingsSubmit,
    handleExportCompanySettings,
    handleImportCompanySettings,
    handleDelete,
    handleExportAllJson,
    handleExportSingleJson,
    handleImportJson,
    handleSendWhatsApp,
  } = useProposalDashboardController();

  const requestCompanySettingsClose = useCallback(() => {
    if (hasUnsavedCompanySettings) {
      setIsCloseCompanySettingsConfirmOpen(true);
      return;
    }

    setIsCompanySettingsOpen(false);
  }, [hasUnsavedCompanySettings, setIsCompanySettingsOpen]);

  const confirmDeleteDraft = useCallback(async () => {
    if (!draftIdPendingDelete) {
      return;
    }

    await handleDelete(draftIdPendingDelete);
    setDraftIdPendingDelete(null);
  }, [draftIdPendingDelete, handleDelete]);

  const confirmCompanySettingsClose = useCallback(() => {
    setIsCloseCompanySettingsConfirmOpen(false);
    setHasUnsavedCompanySettings(false);
    setIsCompanySettingsOpen(false);
  }, [setIsCompanySettingsOpen]);

  const sortedDrafts = useMemo(() => {
    const getDaysRemaining = (draft: (typeof drafts)[number]): number => {
      const issueDate = new Date(draft.snapshot.metadata.issueDate);
      if (Number.isNaN(issueDate.getTime()) || !draft.snapshot.investment.enabled) {
        return Number.POSITIVE_INFINITY;
      }

      const today = new Date();
      const daysSinceIssue = Math.floor((today.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
      const offerValidityDays = draft.snapshot.investment.offerValidityDays ?? 30;
      return offerValidityDays - daysSinceIssue;
    };

    return [...drafts].sort((a, b) => {
      const issueTimeA = new Date(a.snapshot.metadata.issueDate).getTime();
      const issueTimeB = new Date(b.snapshot.metadata.issueDate).getTime();

      if (issueTimeA !== issueTimeB) {
        return issueTimeB - issueTimeA;
      }

      const vigencyA = getDaysRemaining(a);
      const vigencyB = getDaysRemaining(b);
      if (vigencyA !== vigencyB) {
        return vigencyA - vigencyB;
      }

      return new Date(b.snapshot.updatedAt).getTime() - new Date(a.snapshot.updatedAt).getTime();
    });
  }, [drafts]);

  return (
    <div className="space-y-6">
      {/* Create New Button */}
      <div className="flex justify-end gap-2">
        <input
          ref={importJsonInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportJson}
          className="hidden"
        />
        <button
          type="button"
          onClick={handleExportAllJson}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
          Descargar
        </button>
        <button
          type="button"
          onClick={() => importJsonInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21V9" />
            <path d="m7 14 5-5 5 5" />
            <path d="M5 3h14" />
          </svg>
          Importar
        </button>
        <button
          onClick={() => setIsCompanySettingsOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
        >
          <span aria-hidden="true">⚙️</span>
          Configuracion empresa
        </button>
        <button
          onClick={handleCreateNew}
          disabled={creatingNew || isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800 disabled:opacity-50"
        >
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          {creatingNew ? "Creando..." : "Crear Propuesta"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-600">Cargando borradores...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && drafts.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-slate-600 mb-4">No hay propuestas todavia.</p>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800"
          >
            Crear la primera propuesta
          </button>
        </div>
      )}

      {/* Drafts List */}
      {!isLoading && drafts.length > 0 && (
        <div className="grid gap-4">
          {sortedDrafts.map((draft) => (
            <ProposalDraftCard
              key={draft.snapshot.id}
              draft={draft}
              onExport={(proposal) => {
                void handleExportSingleJson(proposal);
              }}
              onDelete={setDraftIdPendingDelete}
              onSendWp={handleSendWhatsApp}
            />
          ))}
        </div>
      )}

      {isCompanySettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:max-w-4xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Configuracion general de empresa</h2>
              <button
                type="button"
                onClick={requestCompanySettingsClose}
                aria-label="Cerrar"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 text-red-600 transition hover:bg-red-50"
              >
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-5">
            <input
              ref={companySettingsImportInputRef}
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                void handleImportCompanySettings(event);
              }}
              className="hidden"
            />
            <div className="mb-5 flex flex-wrap justify-end gap-2 border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={handleExportCompanySettings}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
                Exportar configuracion
              </button>
              <button
                type="button"
                onClick={() => companySettingsImportInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 21V9" />
                  <path d="m7 14 5-5 5 5" />
                  <path d="M5 3h14" />
                </svg>
                Importar configuracion
              </button>
            </div>
            <IssuerForm
              initialData={{
                ...companySettings,
                phone: companySettings.phone ?? "",
                website: companySettings.website ?? "",
                logoUrl: companySettings.logoUrl ?? "",
              }}
              onSubmit={async (data) => {
                await handleCompanySettingsSubmit(data);
                setHasUnsavedCompanySettings(false);
              }}
              isLoading={isLoading}
              onDirtyChange={setHasUnsavedCompanySettings}
            />
            </div>
          </div>
        </div>
      )}

      <BlockingLoaderOverlay isOpen={Boolean(blockingMessage)} message={blockingMessage ?? undefined} />

      <ConfirmationDialog
        isOpen={draftIdPendingDelete !== null}
        title="Eliminar propuesta"
        description="Esta accion eliminara el borrador actual."
        confirmText="Si"
        cancelText="No"
        confirmVariant="danger"
        onConfirm={() => {
          void confirmDeleteDraft();
        }}
        onCancel={() => setDraftIdPendingDelete(null)}
      />

      <ConfirmationDialog
        isOpen={isCloseCompanySettingsConfirmOpen}
        title="Descartar cambios"
        description="Hay cambios sin guardar en la configuracion de empresa. Si cierras ahora, se perderan."
        confirmText="Si"
        cancelText="No"
        confirmVariant="danger"
        onConfirm={confirmCompanySettingsClose}
        onCancel={() => setIsCloseCompanySettingsConfirmOpen(false)}
      />
    </div>
  );
}
