import { ProposalProps } from "../../domain/entities/Proposal";

interface SendProposalEmailPayload {
  proposal: ProposalProps;
  to: string;
  subject: string;
  message: string;
  pdfBase64: string;
}

interface PrepareWhatsAppPayload {
  phone: string;
  proposalId: string;
  message: string;
}

export const sendProposalEmailRequest = async (payload: SendProposalEmailPayload): Promise<void> => {
  const response = await fetch("/api/proposals/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error ?? "No fue posible enviar el correo");
  }
};

export const prepareWhatsAppRequest = async (payload: PrepareWhatsAppPayload): Promise<string> => {
  const response = await fetch("/api/proposals/wp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as { whatsappUrl?: string; error?: string };

  if (!response.ok || !data.whatsappUrl) {
    throw new Error(data.error ?? "No fue posible preparar el enlace de WhatsApp.");
  }

  return data.whatsappUrl;
};
