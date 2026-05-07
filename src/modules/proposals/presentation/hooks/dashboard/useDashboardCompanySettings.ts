import { useCallback, useRef, useState } from "react";
import { createProposalModule } from "../../../composition/proposalModule";
import { IssuerFormDTO, IssuerFormSchema } from "../../../application/dtos/schemas";
import { loadCompanySettings, saveCompanySettings } from "../../../infrastructure/browser/companySettings";
import {
  mapIssuerFormData,
  sanitizeIssuerForDraftPersistence,
} from "../../../application/mappers/companySettingsMapper";
import { Proposal } from "../../../domain/entities/Proposal";
import { downloadTextFile } from "../../../application/services/fileDownload";

interface UseDashboardCompanySettingsParams {
  proposalModule: ReturnType<typeof createProposalModule>;
  setDrafts: React.Dispatch<React.SetStateAction<Proposal[]>>;
  setBlockingMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useDashboardCompanySettings = ({
  proposalModule,
  setDrafts,
  setBlockingMessage,
  setError,
}: UseDashboardCompanySettingsParams) => {
  const [isCompanySettingsOpen, setIsCompanySettingsOpen] = useState(false);
  const companySettingsImportInputRef = useRef<HTMLInputElement | null>(null);
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
            issuer: sanitizeIssuerForDraftPersistence(settings),
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
        setError(null);
        setIsCompanySettingsOpen(false);
      } finally {
        setBlockingMessage(null);
      }
    },
    [applyCompanySettingsToAllDrafts, setBlockingMessage, setError],
  );

  const handleExportCompanySettings = useCallback(() => {
    try {
      downloadTextFile(
        JSON.stringify(companySettings, null, 2),
        "configuracion-empresa.json",
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible exportar la configuracion de empresa.");
    }
  }, [companySettings, setError]);

  const handleImportCompanySettings = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      try {
        setBlockingMessage("Importando configuracion de empresa...");
        const text = await file.text();
        const parsed = JSON.parse(text) as unknown;
        const importedSettings = IssuerFormSchema.parse(parsed);
        const normalizedSettings = mapIssuerFormData(importedSettings);

        setCompanySettings(normalizedSettings);
        saveCompanySettings(normalizedSettings);
        await applyCompanySettingsToAllDrafts(normalizedSettings);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No fue posible importar la configuracion de empresa.");
      } finally {
        event.target.value = "";
        setBlockingMessage(null);
      }
    },
    [applyCompanySettingsToAllDrafts, setBlockingMessage, setError],
  );

  return {
    companySettings,
    companySettingsImportInputRef,
    isCompanySettingsOpen,
    setIsCompanySettingsOpen,
    handleCompanySettingsSubmit,
    handleExportCompanySettings,
    handleImportCompanySettings,
  };
};
