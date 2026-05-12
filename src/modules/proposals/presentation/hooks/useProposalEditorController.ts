import { useCallback, useMemo, useRef, useState } from "react";
import { createProposalModule } from "../../composition/proposalModule";
import { IssuerFormDTO } from "../../application/dtos/schemas";
import { Proposal, ProposalSection } from "../../domain/entities/Proposal";
import { UuidGenerator } from "../../infrastructure/system/UuidGenerator";
import { loadCompanySettings } from "../../infrastructure/browser/companySettings";
import { mapIssuerFormData } from "../../application/mappers/companySettingsMapper";
import {
  mapGeneralDataFormInitialData,
} from "../../application/mappers/proposalEditorMapper";
import { EditorTab, SectionAction } from "../types/editor";
import { useEditorLifecycle } from "./editor/useEditorLifecycle";
import { useEditorAutoSave } from "./editor/useEditorAutoSave";
import { useEditorProposalActions } from "./editor/useEditorProposalActions";
import { useEditorDocumentActions } from "./editor/useEditorDocumentActions";

interface UseProposalEditorControllerParams {
  proposalId: string;
}

export const useProposalEditorController = ({ proposalId }: UseProposalEditorControllerParams) => {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("general");
  const [sectionAction, setSectionAction] = useState<SectionAction>("list");
  const [editingSection, setEditingSection] = useState<ProposalSection | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showExportImport, setShowExportImport] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isEmailPanelOpen, setIsEmailPanelOpen] = useState(false);
  const [isCompanySettingsOpen, setIsCompanySettingsOpen] = useState(false);
  const [blockingMessage, setBlockingMessage] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [companySettings, setCompanySettings] = useState<IssuerFormDTO>(() =>
    mapIssuerFormData(loadCompanySettings() ?? undefined),
  );

  const proposalModule = useMemo(() => createProposalModule(), []);
  const idGenerator = useMemo(() => new UuidGenerator(), []);
  const previewPagesContainerRef = useRef<HTMLDivElement | null>(null);

  const { applyCompanySettingsToAllDrafts, saveGlobalCompanySettings } = useEditorLifecycle({
    proposalId,
    proposalModule,
    setProposal,
    setIsLoading,
    setError,
    setCompanySettings,
    setRecipientEmail,
    setEmailSubject,
    setEmailMessage,
  });

  useEditorAutoSave({
    proposal,
    proposalModule,
    setAutoSaveStatus,
  });

  const {
    handleGeneralDataSubmit,
    handleRenewProposal,
    handleAddSection,
    handleUpdateSection,
    handleDeleteSection,
    handleMoveSection,
    handleToggleSectionVisibility,
    handleClosingSubmit,
    handleInvestmentSubmit,
  } = useEditorProposalActions({
    proposal,
    proposalModule,
    idGenerator,
    editingSection,
    setProposal,
    setError,
    setSectionAction,
    setEditingSection,
  });

  const {
    handleExport,
    handleImport,
    handleGeneratePdf,
    handleSendEmail,
  } = useEditorDocumentActions({
    proposal,
    proposalModule,
    previewPagesContainerRef,
    recipientEmail,
    emailSubject,
    emailMessage,
    setProposal,
    setError,
    setShowExportImport,
    setBlockingMessage,
    setIsGeneratingPdf,
    setIsSendingEmail,
    setAutoSaveStatus,
  });

  const handleIssuerSubmit = useCallback(
    async (data: IssuerFormDTO) => {
      try {
        setBlockingMessage("Guardando configuracion de empresa...");
        saveGlobalCompanySettings(data);
        await applyCompanySettingsToAllDrafts(data);
        setIsCompanySettingsOpen(false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update company settings");
      } finally {
        setBlockingMessage(null);
      }
    },
    [applyCompanySettingsToAllDrafts, saveGlobalCompanySettings],
  );

  const generalDataInitialValues = useMemo(() => {
    if (!proposal) {
      return null;
    }
    return mapGeneralDataFormInitialData(proposal);
  }, [proposal]);

  const pdfValidation = useMemo(() => proposal?.validateForPdf() ?? null, [proposal]);
  const isProposalExpired = useMemo(
    () => (proposal ? proposal.isOfferExpired(new Date()) : false),
    [proposal],
  );
  const safePdfValidation = useMemo(
    () =>
      pdfValidation ?? {
        isValid: false,
        issues: [],
      },
    [pdfValidation],
  );

  return {
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
    pdfValidation: safePdfValidation,
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
  };
};
