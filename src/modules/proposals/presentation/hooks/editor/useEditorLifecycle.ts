import { useCallback, useEffect } from "react";
import { createProposalModule } from "../../../composition/proposalModule";
import { IssuerFormDTO } from "../../../application/dtos/schemas";
import {
  loadCompanySettings,
  saveCompanySettings,
} from "../../../infrastructure/browser/companySettings";
import { mapIssuerFormData } from "../../../application/mappers/companySettingsMapper";
import { mapProposalEmailDefaults } from "../../../application/mappers/proposalEditorMapper";
import { Proposal } from "../../../domain/entities/Proposal";

interface UseEditorLifecycleParams {
  proposalId: string;
  proposalModule: ReturnType<typeof createProposalModule>;
  setProposal: React.Dispatch<React.SetStateAction<Proposal | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setCompanySettings: React.Dispatch<React.SetStateAction<IssuerFormDTO>>;
  setRecipientEmail: React.Dispatch<React.SetStateAction<string>>;
  setEmailSubject: React.Dispatch<React.SetStateAction<string>>;
  setEmailMessage: React.Dispatch<React.SetStateAction<string>>;
}

export const useEditorLifecycle = ({
  proposalId,
  proposalModule,
  setProposal,
  setIsLoading,
  setError,
  setCompanySettings,
  setRecipientEmail,
  setEmailSubject,
  setEmailMessage,
}: UseEditorLifecycleParams) => {
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

      const currentUpdated = updatedDrafts.find((draft) => draft.snapshot.id === proposalId);
      if (currentUpdated) {
        setProposal(currentUpdated);
      }
    },
    [proposalId, proposalModule, setProposal],
  );

  useEffect(() => {
    const loadProposal = async () => {
      try {
        setIsLoading(true);
        const storedSettings = loadCompanySettings();
        if (storedSettings) {
          setCompanySettings(mapIssuerFormData(storedSettings));
        }

        const loaded = await proposalModule.listProposalDrafts.execute();
        const current = loaded.find((item) => item.snapshot.id === proposalId);

        if (!current) {
          setError("Proposal not found");
          return;
        }

        const issuerToApply = mapIssuerFormData(storedSettings ?? current.snapshot.issuer);
        const proposalWithGlobalIssuer = await proposalModule.updateProposalDraft.execute({
          proposalId: current.snapshot.id,
          issuer: issuerToApply,
        });

        const emailDefaults = mapProposalEmailDefaults(proposalWithGlobalIssuer);

        setProposal(proposalWithGlobalIssuer);
        setRecipientEmail(emailDefaults.recipientEmail);
        setEmailSubject(emailDefaults.emailSubject);
        setEmailMessage(emailDefaults.emailMessage);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load proposal");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProposal();
  }, [
    proposalId,
    proposalModule,
    setCompanySettings,
    setEmailMessage,
    setEmailSubject,
    setError,
    setIsLoading,
    setProposal,
    setRecipientEmail,
  ]);

  const saveGlobalCompanySettings = useCallback(
    (data: IssuerFormDTO) => {
      const normalized = mapIssuerFormData(data);
      setCompanySettings(normalized);
      saveCompanySettings(data);
    },
    [setCompanySettings],
  );

  return {
    applyCompanySettingsToAllDrafts,
    saveGlobalCompanySettings,
  };
};
