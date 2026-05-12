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
  const preparePublishedProposal = useCallback(async (): Promise<Proposal | null> => {
    if (!proposal) {
      return null;
    }

    const published = proposal.prepareForPublication(new Date());
    const saved = await proposalModule.saveProposalSnapshot.execute(published.snapshot);
    setProposal(saved);
    setAutoSaveStatus("saved");
    return saved;
  }, [proposal, proposalModule, setAutoSaveStatus, setProposal]);

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
      const publishedProposal = await preparePublishedProposal();
      if (!publishedProposal) {
        return;
      }

      // Ensure the preview reflects the latest version metadata before capture.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

      const blob = await createProposalPreviewPdfBlob(previewPagesContainerRef.current);
      const version = publishedProposal.snapshot.metadata.version ?? 1;
      const fileName = `${publishedProposal.snapshot.metadata.title || "propuesta"}-v${version}.pdf`;
      downloadBlobFile(blob, fileName);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible generar el PDF");
    } finally {
      setIsGeneratingPdf(false);
      setBlockingMessage(null);
    }
  }, [preparePublishedProposal, previewPagesContainerRef, proposal, setBlockingMessage, setError, setIsGeneratingPdf]);

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
      const publishedProposal = await preparePublishedProposal();
      if (!publishedProposal) {
        return;
      }

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

      const previewPdfBlob = await createProposalPreviewPdfBlob(previewPagesContainerRef.current);
      const previewPdfBase64 = await proposalPdfBlobToBase64(previewPdfBlob);

      await sendProposalEmailRequest({
        proposal: publishedProposal.snapshot,
        to: recipientEmail.trim(),
        subject: emailSubject,
        message: emailMessage,
        pdfBase64: previewPdfBase64,
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
    preparePublishedProposal,
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
