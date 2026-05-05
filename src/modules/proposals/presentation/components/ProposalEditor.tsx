"use client";

import { useProposalEditorController } from "../hooks/useProposalEditorController";
import { EditorTab } from "../types/editor";
import { GeneralDataForm } from "./GeneralDataForm";
import { InvestmentForm } from "./InvestmentForm";
import { IssuerForm } from "./IssuerForm";
import { ProposalPdfReadinessPanel } from "./ProposalPdfReadinessPanel";
import { BlockingLoaderOverlay } from "../../../shared/presentation/components/BlockingLoaderOverlay";
import { ProposalEditorSectionsTab } from "./ProposalEditorSectionsTab";
import { ProposalEditorClosingTab } from "./ProposalEditorClosingTab";
import { ProposalEditorPreviewTab } from "./ProposalEditorPreviewTab";

interface ProposalEditorProps {
  proposalId: string;
}

export function ProposalEditor({ proposalId }: ProposalEditorProps) {
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
    pdfValidation,
    handleGeneralDataSubmit,
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
  const editorTabs: EditorTab[] = ["general", "sections", "investment", "closing", "preview"];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{snap.metadata.title}</h1>
            {snap.metadata.subtitle && (
              <p className="mt-1 text-slate-600">{snap.metadata.subtitle}</p>
            )}
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
          <div className="text-right text-xs text-slate-500">
            <p>ID: {snap.id}</p>
            <p>Actualizado: {new Date(snap.updatedAt).toLocaleString()}</p>
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
      <div className="flex gap-2 border-b border-slate-200">
        {editorTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSectionAction("list");
            }}
            className={`px-4 py-2 text-sm font-medium transition ${
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
              initialData={generalDataInitialValues}
              onSubmit={handleGeneralDataSubmit}
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
              onSubmit={handleIssuerSubmit}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      <BlockingLoaderOverlay isOpen={Boolean(blockingMessage)} message={blockingMessage ?? undefined} />
    </div>
  );
}
