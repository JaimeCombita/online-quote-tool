import { Proposal } from "../../domain/entities/Proposal";

export interface GeneralDataFormInitialData {
  title: string;
  subtitle: string;
  clientName: string;
  clientCompany: string;
  clientContact: string;
  clientPhone: string;
  clientEmail: string;
  issueDate: string;
  city: string;
  currency: "COP" | "USD";
}

export interface ProposalEmailDefaults {
  recipientEmail: string;
  emailSubject: string;
  emailMessage: string;
}

export const mapGeneralDataFormInitialData = (proposal: Proposal): GeneralDataFormInitialData => ({
  title: proposal.snapshot.metadata.title,
  subtitle: proposal.snapshot.metadata.subtitle || "",
  clientName: proposal.snapshot.client.name,
  clientCompany: proposal.snapshot.client.company || "",
  clientContact: proposal.snapshot.client.contactName || "",
  clientPhone: proposal.snapshot.client.phone || "",
  clientEmail: proposal.snapshot.client.email || "",
  issueDate: proposal.snapshot.metadata.issueDate,
  city: proposal.snapshot.metadata.city || "",
  currency: proposal.snapshot.metadata.currency,
});

export const mapProposalEmailDefaults = (proposal: Proposal): ProposalEmailDefaults => ({
  recipientEmail: proposal.snapshot.client.email ?? "",
  emailSubject: `Propuesta comercial - ${proposal.snapshot.metadata.title}`,
  emailMessage: [
    `Hola ${proposal.snapshot.client.name || ""},`,
    "",
    "Adjunto encontrarás la propuesta comercial solicitada.",
    "",
    "Quedo atento(a) a tus comentarios.",
    "",
    `${proposal.snapshot.issuer.responsibleName}`,
    `${proposal.snapshot.issuer.role}`,
    `${proposal.snapshot.issuer.businessName}`,
  ].join("\n"),
});
