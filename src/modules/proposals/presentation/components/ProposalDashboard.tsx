"use client";

import { useProposalDashboardController } from "../hooks/useProposalDashboardController";
import { IssuerForm } from "./IssuerForm";
import { BlockingLoaderOverlay } from "../../../shared/presentation/components/BlockingLoaderOverlay";
import { ProposalDraftCard } from "./ProposalDraftCard";

export function ProposalDashboard() {
  const {
    drafts,
    isLoading,
    error,
    creatingNew,
    isCompanySettingsOpen,
    setIsCompanySettingsOpen,
    blockingMessage,
    companySettings,
    importJsonInputRef,
    handleCreateNew,
    handleCompanySettingsSubmit,
    handleDelete,
    handleExportAllJson,
    handleExportSingleJson,
    handleImportJson,
    handleSendWhatsApp,
  } = useProposalDashboardController();

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
          className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Descargar todo JSON
        </button>
        <button
          type="button"
          onClick={() => importJsonInputRef.current?.click()}
          className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Importar JSON
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
          className="inline-flex items-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800 disabled:opacity-50"
        >
          {creatingNew ? "Creando..." : "+ Nueva propuesta"}
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
          {drafts.map((draft) => (
            <ProposalDraftCard
              key={draft.snapshot.id}
              draft={draft}
              onExport={(proposalId) => {
                void handleExportSingleJson(proposalId);
              }}
              onDelete={handleDelete}
              onSendWp={handleSendWhatsApp}
            />
          ))}
        </div>
      )}

      {isCompanySettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Configuracion general de empresa</h2>
              <button
                type="button"
                onClick={() => setIsCompanySettingsOpen(false)}
                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>
            <IssuerForm
              initialData={{
                ...companySettings,
                phone: companySettings.phone ?? "",
                website: companySettings.website ?? "",
                logoUrl: companySettings.logoUrl ?? "",
              }}
              onSubmit={handleCompanySettingsSubmit}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      <BlockingLoaderOverlay isOpen={Boolean(blockingMessage)} message={blockingMessage ?? undefined} />
    </div>
  );
}
