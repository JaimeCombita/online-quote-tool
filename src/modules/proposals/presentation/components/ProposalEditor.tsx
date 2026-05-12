"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useProposalEditorController } from "../hooks/useProposalEditorController";
import { EditorTab } from "../types/editor";
import { GeneralDataForm } from "./GeneralDataForm";
import { InvestmentForm } from "./InvestmentForm";
import { IssuerForm } from "./IssuerForm";
import { ProposalPdfReadinessPanel } from "./ProposalPdfReadinessPanel";
import { BlockingLoaderOverlay } from "../../../shared/presentation/components/BlockingLoaderOverlay";
import { ConfirmationDialog } from "../../../shared/presentation/components/ConfirmationDialog";
import { ProposalEditorSectionsTab } from "./ProposalEditorSectionsTab";
import { ProposalEditorClosingTab } from "./ProposalEditorClosingTab";
import { ProposalEditorPreviewTab } from "./ProposalEditorPreviewTab";

interface ProposalEditorProps {
  proposalId: string;
}

export function ProposalEditor({ proposalId }: ProposalEditorProps) {
  const [hasUnsavedCompanySettings, setHasUnsavedCompanySettings] = useState(false);
  const [isCloseCompanySettingsConfirmOpen, setIsCloseCompanySettingsConfirmOpen] = useState(false);
  const {
    proposal,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    sectionAction,
    setSectionAction,
    editingSection,
    setEditingSection,
    autoSaveStatus,
    showExportImport,
    setShowExportImport,
    isGeneratingPdf,
    isSendingEmail,
    isEmailPanelOpen,
    setIsEmailPanelOpen,
    isCompanySettingsOpen,
    setIsCompanySettingsOpen,
    blockingMessage,
    recipientEmail,
    setRecipientEmail,
    emailSubject,
    setEmailSubject,
    emailMessage,
    setEmailMessage,
    companySettings,
    previewPagesContainerRef,
    generalDataInitialValues,
    isProposalExpired,
    pdfValidation,
    handleGeneralDataSubmit,
    handleRenewProposal,
    handleIssuerSubmit,
    handleAddSection,
    handleUpdateSection,
    handleDeleteSection,
    handleMoveSection,
    handleToggleSectionVisibility,
    handleClosingSubmit,
    handleInvestmentSubmit,
    handleExport,
    handleImport,
    handleGeneratePdf,
    handleSendEmail,
  } = useProposalEditorController({ proposalId });

  const requestCompanySettingsClose = useCallback(() => {
    if (hasUnsavedCompanySettings) {
      setIsCloseCompanySettingsConfirmOpen(true);
      return;
    }

    setIsCompanySettingsOpen(false);
  }, [hasUnsavedCompanySettings, setIsCompanySettingsOpen]);

  const confirmCompanySettingsClose = useCallback(() => {
    setIsCloseCompanySettingsConfirmOpen(false);
    setHasUnsavedCompanySettings(false);
    setIsCompanySettingsOpen(false);
  }, [setIsCompanySettingsOpen]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-slate-600">Cargando propuesta...</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error || "Propuesta no encontrada"}</p>
      </div>
    );
  }

  const snap = proposal.snapshot;
  const proposalVersion = snap.metadata.version ?? 1;
  const hasUnpublishedChanges = snap.publicationState?.hasUnpublishedChanges ?? false;
  const editorTabs: EditorTab[] = ["general", "sections", "investment", "closing", "preview"];

  return (
    <div className="space-y-4">
      <div className="sticky top-2 z-20">
        <div className="inline-flex rounded-lg border border-slate-300 bg-white/95 px-2 py-1 shadow-sm backdrop-blur">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <span aria-hidden="true">←</span>
            Volver
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{snap.metadata.title}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
              >
                Abrir vista previa HTML
              </button>
              <button
                type="button"
                onClick={() => setIsCompanySettingsOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
              >
                <span aria-hidden="true">⚙️</span>
                Configuracion empresa
              </button>
            </div>
          </div>
          <div className="text-left text-xs text-slate-500 sm:text-right">
            <p className="break-all">ID: {snap.id}</p>
            <p>Actualizado: {new Date(snap.updatedAt).toLocaleString()}</p>
            <p>Version: v{proposalVersion}</p>
            <p className={hasUnpublishedChanges ? "text-amber-600" : "text-emerald-600"}>
              {hasUnpublishedChanges ? "Cambios pendientes de publicar" : "Publicada"}
            </p>
            <p className="mt-2">
              Estado: 
              <span
                className={`ml-2 inline-block px-2 py-1 rounded text-xs font-medium ${
                  autoSaveStatus === "saving"
                    ? "bg-yellow-100 text-yellow-700"
                    : autoSaveStatus === "saved"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600"
                }`}
              >
                {autoSaveStatus === "saving" ? "Guardando..." : autoSaveStatus === "saved" ? "Guardado" : "Listo"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <ProposalPdfReadinessPanel validation={pdfValidation} />

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-1">
        {editorTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSectionAction("list");
            }}
            className={`shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium transition ${
              activeTab === tab
                ? "border-b-2 border-sky-700 text-sky-700"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab === "general" && "Datos generales"}
            {tab === "sections" && "Secciones"}
            {tab === "investment" && "Inversion"}
            {tab === "closing" && "Cierre"}
            {tab === "preview" && "Vista previa HTML"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        {/* General Tab */}
        {activeTab === "general" && (
          generalDataInitialValues && (
            <GeneralDataForm
              key={snap.updatedAt}
              initialData={generalDataInitialValues}
              onSubmit={handleGeneralDataSubmit}
              isOfferExpired={isProposalExpired}
              onRenewProposal={handleRenewProposal}
              isLoading={isLoading}
            />
          )
        )}

        {/* Sections Tab */}
        {activeTab === "sections" && (
          <ProposalEditorSectionsTab
            sections={snap.sections}
            sectionAction={sectionAction}
            editingSection={editingSection}
            showExportImport={showExportImport}
            onToggleExportImport={() => setShowExportImport((current) => !current)}
            onStartCreate={() => setSectionAction("create")}
            onCancelCreateOrEdit={() => {
              setSectionAction("list");
              setEditingSection(null);
            }}
            onAddSection={handleAddSection}
            onUpdateSection={handleUpdateSection}
            onDeleteSection={handleDeleteSection}
            onMoveSection={handleMoveSection}
            onToggleSectionVisibility={handleToggleSectionVisibility}
            onEditSection={(section) => {
              setEditingSection(section);
              setSectionAction("edit");
            }}
            onExport={handleExport}
            onImport={handleImport}
          />
        )}

        {activeTab === "investment" && (
          <InvestmentForm
            key={snap.updatedAt}
            initialData={snap.investment}
            currency={snap.metadata.currency}
            onSubmit={handleInvestmentSubmit}
          />
        )}

        {/* Closing Tab */}
        {activeTab === "closing" && (
          <ProposalEditorClosingTab
            defaultClosingText={snap.closingText || ""}
            defaultShowSignature={snap.showSignature}
            onSubmit={handleClosingSubmit}
          />
        )}

        {activeTab === "preview" && (
          <ProposalEditorPreviewTab
            proposal={proposal}
            pdfValidation={pdfValidation}
            previewPagesContainerRef={previewPagesContainerRef}
            isGeneratingPdf={isGeneratingPdf}
            isEmailPanelOpen={isEmailPanelOpen}
            isSendingEmail={isSendingEmail}
            recipientEmail={recipientEmail}
            emailSubject={emailSubject}
            emailMessage={emailMessage}
            onToggleEmailPanel={() => setIsEmailPanelOpen((current) => !current)}
            onRecipientEmailChange={setRecipientEmail}
            onEmailSubjectChange={setEmailSubject}
            onEmailMessageChange={setEmailMessage}
            onGeneratePdf={handleGeneratePdf}
            onSendEmail={handleSendEmail}
          />
        )}
      </div>

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
            <IssuerForm
              initialData={{
                ...companySettings,
                phone: companySettings.phone ?? "",
                website: companySettings.website ?? "",
                logoUrl: companySettings.logoUrl ?? "",
              }}
              onSubmit={async (data) => {
                await handleIssuerSubmit(data);
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
