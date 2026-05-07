import { useMemo } from "react";
import { createProposalModule } from "../../composition/proposalModule";
import { useDashboardDrafts } from "./dashboard/useDashboardDrafts";
import { useDashboardCompanySettings } from "./dashboard/useDashboardCompanySettings";
import { useDashboardTransferActions } from "./dashboard/useDashboardTransferActions";

export const useProposalDashboardController = () => {
  const proposalModule = useMemo(() => createProposalModule(), []);
  const {
    drafts,
    setDrafts,
    isLoading,
    error,
    setError,
    creatingNew,
    blockingMessage,
    setBlockingMessage,
    loadDrafts,
    handleCreateNew,
    handleDelete,
  } = useDashboardDrafts({
    proposalModule,
  });

  const {
    companySettings,
    companySettingsImportInputRef,
    isCompanySettingsOpen,
    setIsCompanySettingsOpen,
    handleCompanySettingsSubmit,
    handleExportCompanySettings,
    handleImportCompanySettings,
  } = useDashboardCompanySettings({
    proposalModule,
    setDrafts,
    setBlockingMessage,
    setError,
  });

  const {
    importJsonInputRef,
    handleExportAllJson,
    handleExportSingleJson,
    handleImportJson,
    handleSendWhatsApp,
  } = useDashboardTransferActions({
    proposalModule,
    loadDrafts,
    setError,
    setBlockingMessage,
  });

  const handleCreateNewWithCompanySettings = () => handleCreateNew(companySettings);

  return {
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
    handleCreateNew: handleCreateNewWithCompanySettings,
    handleCompanySettingsSubmit,
    handleExportCompanySettings,
    handleImportCompanySettings,
    handleDelete,
    handleExportAllJson,
    handleExportSingleJson,
    handleImportJson,
    handleSendWhatsApp,
  };
};
