import { useCallback, useRef } from "react";
import { createProposalModule } from "../../../composition/proposalModule";
import { Proposal, ProposalProps } from "../../../domain/entities/Proposal";
import { downloadTextFile } from "../../../application/services/fileDownload";
import { prepareWhatsAppRequest } from "../../../application/services/proposalApiClient";

interface UseDashboardTransferActionsParams {
  proposalModule: ReturnType<typeof createProposalModule>;
  loadDrafts: () => Promise<void>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setBlockingMessage: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useDashboardTransferActions = ({
  proposalModule,
  loadDrafts,
  setError,
  setBlockingMessage,
}: UseDashboardTransferActionsParams) => {
  const importJsonInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportAllJson = useCallback(async () => {
    try {
      setBlockingMessage("Generando archivo JSON...");
      const loaded = await proposalModule.listProposalDrafts.execute();
      const payload = loaded.map((draft) => draft.snapshot);
      downloadTextFile(JSON.stringify(payload, null, 2), "propuestas-export.json");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible exportar las propuestas.");
    } finally {
      setBlockingMessage(null);
    }
  }, [proposalModule, setBlockingMessage, setError]);

  const handleExportSingleJson = useCallback(
    async (proposalId: string) => {
      try {
        setBlockingMessage("Exportando propuesta en JSON...");
        const json = await proposalModule.exportProposal.execute(proposalId);
        downloadTextFile(json, `propuesta-${proposalId}.json`);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No fue posible exportar la propuesta.");
      } finally {
        setBlockingMessage(null);
      }
    },
    [proposalModule, setBlockingMessage, setError],
  );

  const handleImportJson = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      try {
        setBlockingMessage("Importando propuestas desde JSON...");
        const text = await file.text();
        const parsed = JSON.parse(text) as ProposalProps | ProposalProps[];

        if (Array.isArray(parsed)) {
          await Promise.all(
            parsed.map((proposal) => proposalModule.importProposal.execute(JSON.stringify(proposal))),
          );
        } else {
          await proposalModule.importProposal.execute(JSON.stringify(parsed));
        }

        await loadDrafts();
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No fue posible importar el archivo JSON.");
      } finally {
        event.target.value = "";
        setBlockingMessage(null);
      }
    },
    [loadDrafts, proposalModule, setBlockingMessage, setError],
  );

  const handleSendWhatsApp = useCallback(
    async (draft: Proposal) => {
      const phone = draft.snapshot.client.phone ?? "";
      if (!phone.trim()) {
        return;
      }

      try {
        setBlockingMessage("Preparando envio por WhatsApp...");
        const whatsappUrl = await prepareWhatsAppRequest({
          phone,
          proposalId: draft.snapshot.id,
          message: `Hola ${draft.snapshot.client.name || ""}, te comparto la propuesta "${draft.snapshot.metadata.title}".`,
        });
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No fue posible enviar por WhatsApp");
      } finally {
        setBlockingMessage(null);
      }
    },
    [setBlockingMessage, setError],
  );

  return {
    importJsonInputRef,
    handleExportAllJson,
    handleExportSingleJson,
    handleImportJson,
    handleSendWhatsApp,
  };
};
