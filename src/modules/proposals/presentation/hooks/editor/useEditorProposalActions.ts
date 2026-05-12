import { useCallback } from "react";
import { createProposalModule } from "../../../composition/proposalModule";
import { GeneralFormDTO, SectionFormDTO } from "../../../application/dtos/schemas";
import { Proposal, ProposalSection } from "../../../domain/entities/Proposal";
import { UuidGenerator } from "../../../infrastructure/system/UuidGenerator";
import { SectionAction } from "../../types/editor";

interface UseEditorProposalActionsParams {
  proposal: Proposal | null;
  proposalModule: ReturnType<typeof createProposalModule>;
  idGenerator: UuidGenerator;
  editingSection: ProposalSection | null;
  setProposal: React.Dispatch<React.SetStateAction<Proposal | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSectionAction: React.Dispatch<React.SetStateAction<SectionAction>>;
  setEditingSection: React.Dispatch<React.SetStateAction<ProposalSection | null>>;
}

export const useEditorProposalActions = ({
  proposal,
  proposalModule,
  idGenerator,
  editingSection,
  setProposal,
  setError,
  setSectionAction,
  setEditingSection,
}: UseEditorProposalActionsParams) => {
  const handleGeneralDataSubmit = useCallback(
    async (data: GeneralFormDTO) => {
      if (!proposal) {
        return;
      }

      try {
        const updated = await proposalModule.updateProposalDraft.execute({
          proposalId: proposal.snapshot.id,
          metadata: {
            title: data.title,
            issueDate: proposal.snapshot.metadata.issueDate,
            city: data.city,
            currency: data.currency,
          },
          client: {
            name: data.clientName,
            company: data.clientCompany,
            contactName: data.clientContact,
            phone: data.clientPhone,
            email: data.clientEmail,
          },
        });
        setProposal(updated);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update proposal");
      }
    },
    [proposal, proposalModule, setError, setProposal],
  );

  const handleRenewProposal = useCallback(async () => {
    if (!proposal) {
      return;
    }

    if (!proposal.isOfferExpired(new Date())) {
      setError("La propuesta aun no esta vencida.");
      return;
    }

    try {
      const renewedIssueDate = new Date().toISOString();
      const updated = await proposalModule.updateProposalDraft.execute({
        proposalId: proposal.snapshot.id,
        metadata: {
          issueDate: renewedIssueDate,
        },
      });
      setProposal(updated);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to renew proposal");
    }
  }, [proposal, proposalModule, setError, setProposal]);

  const handleAddSection = useCallback(
    async (data: SectionFormDTO) => {
      if (!proposal) {
        return;
      }

      try {
        const newSection: ProposalSection = {
          id: idGenerator.generate(),
          title: data.title,
          content: data.content,
          kind: data.kind,
          isVisible: true,
        };

        const updated = await proposalModule.addSection.execute(proposal.snapshot.id, newSection);
        setProposal(updated);
        setSectionAction("list");
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add section");
      }
    },
    [idGenerator, proposal, proposalModule, setError, setProposal, setSectionAction],
  );

  const handleUpdateSection = useCallback(
    async (data: SectionFormDTO) => {
      if (!proposal || !editingSection) {
        return;
      }

      try {
        const updated = await proposalModule.updateSection.execute(
          proposal.snapshot.id,
          editingSection.id,
          {
            title: data.title,
            content: data.content,
            kind: data.kind,
          },
        );
        setProposal(updated);
        setSectionAction("list");
        setEditingSection(null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update section");
      }
    },
    [editingSection, proposal, proposalModule, setEditingSection, setError, setProposal, setSectionAction],
  );

  const handleDeleteSection = useCallback(
    async (sectionId: string) => {
      if (!proposal) {
        return;
      }

      try {
        const updated = await proposalModule.deleteSection.execute(proposal.snapshot.id, sectionId);
        setProposal(updated);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete section");
      }
    },
    [proposal, proposalModule, setError, setProposal],
  );

  const handleMoveSection = useCallback(
    async (sectionId: string, direction: "up" | "down") => {
      if (!proposal) {
        return;
      }

      try {
        const updated = await proposalModule.moveSection.execute(
          proposal.snapshot.id,
          sectionId,
          direction,
        );
        setProposal(updated);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to move section");
      }
    },
    [proposal, proposalModule, setError, setProposal],
  );

  const handleToggleSectionVisibility = useCallback(
    async (sectionId: string) => {
      if (!proposal) {
        return;
      }

      try {
        const updated = await proposalModule.toggleSectionVisibility.execute(
          proposal.snapshot.id,
          sectionId,
        );
        setProposal(updated);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to toggle section visibility");
      }
    },
    [proposal, proposalModule, setError, setProposal],
  );

  const handleClosingSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!proposal) {
        return;
      }

      const formData = new FormData(event.currentTarget);
      const closingText = String(formData.get("closingText") ?? "");
      const showSignature = formData.get("showSignature") === "on";

      try {
        const updated = await proposalModule.updateProposalDraft.execute({
          proposalId: proposal.snapshot.id,
          closingText,
          showSignature,
        });
        setProposal(updated);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update closing section");
      }
    },
    [proposal, proposalModule, setError, setProposal],
  );

  const handleInvestmentSubmit = useCallback(
    async (investment: Proposal["snapshot"]["investment"]) => {
      if (!proposal) {
        return;
      }

      try {
        const updated = await proposalModule.updateProposalDraft.execute({
          proposalId: proposal.snapshot.id,
          investment,
        });
        setProposal(updated);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update investment block");
      }
    },
    [proposal, proposalModule, setError, setProposal],
  );

  return {
    handleGeneralDataSubmit,
    handleRenewProposal,
    handleAddSection,
    handleUpdateSection,
    handleDeleteSection,
    handleMoveSection,
    handleToggleSectionVisibility,
    handleClosingSubmit,
    handleInvestmentSubmit,
  };
};
