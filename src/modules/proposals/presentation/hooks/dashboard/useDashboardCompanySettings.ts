import { useCallback, useState } from "react";
import { createProposalModule } from "../../../composition/proposalModule";
import { IssuerFormDTO } from "../../../application/dtos/schemas";
import { loadCompanySettings, saveCompanySettings } from "../../../infrastructure/browser/companySettings";
import { mapIssuerFormData } from "../../../application/mappers/companySettingsMapper";
import { Proposal } from "../../../domain/entities/Proposal";

interface UseDashboardCompanySettingsParams {
  proposalModule: ReturnType<typeof createProposalModule>;
  setDrafts: React.Dispatch<React.SetStateAction<Proposal[]>>;
  setBlockingMessage: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useDashboardCompanySettings = ({
  proposalModule,
  setDrafts,
  setBlockingMessage,
}: UseDashboardCompanySettingsParams) => {
  const [isCompanySettingsOpen, setIsCompanySettingsOpen] = useState(false);
  const [companySettings, setCompanySettings] = useState<IssuerFormDTO>(() =>
    mapIssuerFormData(loadCompanySettings() ?? undefined),
  );

  const applyCompanySettingsToAllDrafts = useCallback(
    async (settings: IssuerFormDTO) => {
      const loadedDrafts = await proposalModule.listProposalDrafts.execute();
      const updatedDrafts = await Promise.all(
        loadedDrafts.map((draft) =>
          proposalModule.updateProposalDraft.execute({
            proposalId: draft.snapshot.id,
            issuer: settings,
          }),
        ),
      );
      setDrafts(updatedDrafts);
    },
    [proposalModule, setDrafts],
  );

  const handleCompanySettingsSubmit = useCallback(
    async (data: IssuerFormDTO) => {
      try {
        setBlockingMessage("Guardando configuracion de empresa...");
        setCompanySettings(mapIssuerFormData(data));
        saveCompanySettings(data);
        await applyCompanySettingsToAllDrafts(data);
        setIsCompanySettingsOpen(false);
      } finally {
        setBlockingMessage(null);
      }
    },
    [applyCompanySettingsToAllDrafts, setBlockingMessage],
  );

  return {
    companySettings,
    isCompanySettingsOpen,
    setIsCompanySettingsOpen,
    handleCompanySettingsSubmit,
  };
};
