import { useCallback } from "react";
import { createProposalModule } from "../../../composition/proposalModule";
import { Proposal } from "../../../domain/entities/Proposal";
import { downloadBlobFile, downloadTextFile } from "../../../application/services/fileDownload";
import {
  createProposalPreviewPdfBlob,
  proposalPdfBlobToBase64,
} from "../../../application/services/proposalPreviewPdfService";
import { sendProposalEmailRequest } from "../../../application/services/proposalApiClient";

interface UseEditorDocumentActionsParams {
  proposal: Proposal | null;
  proposalModule: ReturnType<typeof createProposalModule>;
  previewPagesContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  recipientEmail: string;
  emailSubject: string;
  emailMessage: string;
  setProposal: React.Dispatch<React.SetStateAction<Proposal | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setShowExportImport: React.Dispatch<React.SetStateAction<boolean>>;
  setBlockingMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setIsGeneratingPdf: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSendingEmail: React.Dispatch<React.SetStateAction<boolean>>;
  setAutoSaveStatus: React.Dispatch<React.SetStateAction<"idle" | "saving" | "saved">>;
}

export const useEditorDocumentActions = ({
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
}: UseEditorDocumentActionsParams) => {
  const handleExport = useCallback(async () => {
    if (!proposal) {
      return;
    }

    try {
      const json = await proposalModule.exportProposal.execute(proposal.snapshot.id);
      downloadTextFile(json, `proposal-${proposal.snapshot.id}.json`);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export proposal");
    }
  }, [proposal, proposalModule, setError]);

  const handleImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      try {
        const content = await file.text();
        const imported = await proposalModule.importProposal.execute(content);
        setProposal(imported);
        setError(null);
        setShowExportImport(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to import proposal");
      }
    },
    [proposalModule, setError, setProposal, setShowExportImport],
  );

  const handleGeneratePdf = useCallback(async () => {
    if (!proposal) {
      return;
    }

    setBlockingMessage("Generando PDF...");
    setIsGeneratingPdf(true);

    try {
      const blob = await createProposalPreviewPdfBlob(previewPagesContainerRef.current);
      const fileName = `${proposal.snapshot.metadata.title || "propuesta"}.pdf`;
      downloadBlobFile(blob, fileName);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible generar el PDF");
    } finally {
      setIsGeneratingPdf(false);
      setBlockingMessage(null);
    }
  }, [previewPagesContainerRef, proposal, setBlockingMessage, setError, setIsGeneratingPdf]);

  const handleSendEmail = useCallback(async () => {
    if (!proposal) {
      return;
    }

    if (!recipientEmail.trim()) {
      setError("Debes ingresar un correo destinatario para enviar la propuesta.");
      return;
    }

    setBlockingMessage("Enviando correo con PDF adjunto...");
    setIsSendingEmail(true);

    try {
      const previewPdfBlob = await createProposalPreviewPdfBlob(previewPagesContainerRef.current);
      const pdfBase64 = await proposalPdfBlobToBase64(previewPdfBlob);

      await sendProposalEmailRequest({
        proposal: proposal.snapshot,
        to: recipientEmail.trim(),
        subject: emailSubject,
        message: emailMessage,
        pdfBase64,
      });

      setError(null);
      setAutoSaveStatus("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible enviar el correo");
    } finally {
      setIsSendingEmail(false);
      setBlockingMessage(null);
    }
  }, [
    emailMessage,
    emailSubject,
    previewPagesContainerRef,
    proposal,
    recipientEmail,
    setAutoSaveStatus,
    setBlockingMessage,
    setError,
    setIsSendingEmail,
  ]);

  return {
    handleExport,
    handleImport,
    handleGeneratePdf,
    handleSendEmail,
  };
};
