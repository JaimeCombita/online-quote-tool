import { useCallback, useEffect, useRef, useState } from "react";
import { createProposalModule } from "../../../composition/proposalModule";
import { Proposal } from "../../../domain/entities/Proposal";
import { IssuerFormDTO } from "../../../application/dtos/schemas";

interface UseDashboardDraftsParams {
  proposalModule: ReturnType<typeof createProposalModule>;
}

export const useDashboardDrafts = ({
  proposalModule,
}: UseDashboardDraftsParams) => {
  const [drafts, setDrafts] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [blockingMessage, setBlockingMessage] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  const loadDrafts = useCallback(async () => {
    try {
      setIsLoading(true);
      const loaded = await proposalModule.listProposalDrafts.execute();
      setDrafts(loaded);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drafts");
    } finally {
      setIsLoading(false);
    }
  }, [proposalModule]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadDrafts().catch(console.error);
    }
  }, [loadDrafts]);

  const handleCreateNew = useCallback(async (companySettings: IssuerFormDTO) => {
    try {
      setBlockingMessage("Creando propuesta...");
      setCreatingNew(true);
      const newDraft = await proposalModule.createProposalDraft.execute();
      const newDraftWithSettings = await proposalModule.updateProposalDraft.execute({
        proposalId: newDraft.snapshot.id,
        issuer: companySettings,
      });
      setDrafts((prev) => [...prev, newDraftWithSettings]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create new draft");
    } finally {
      setCreatingNew(false);
      setBlockingMessage(null);
    }
  }, [proposalModule]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("¿Estás seguro de que quieres eliminar este borrador?")) {
        return;
      }

      try {
        setBlockingMessage("Eliminando propuesta...");
        await proposalModule.deleteProposalDraft.execute(id);
        setDrafts((prev) => prev.filter((d) => d.snapshot.id !== id));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete draft");
      } finally {
        setBlockingMessage(null);
      }
    },
    [proposalModule],
  );

  return {
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
  };
};
