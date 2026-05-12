import { z } from "zod";
import { PROPOSAL_TITLE_MAX_LENGTH } from "../../domain/constants/proposalConstraints";

// Metadata
export const ProposalMetadataSchema = z.object({
  title: z.string().min(1, "El titulo es requerido").max(PROPOSAL_TITLE_MAX_LENGTH, `El titulo no puede superar ${PROPOSAL_TITLE_MAX_LENGTH} caracteres`),
  issueDate: z.string(),
  city: z.string().optional().default(""),
  currency: z.enum(["COP", "USD"]).default("COP"),
  version: z.number().int().positive().optional().default(1),
  lastPublishedContentHash: z.string().optional().default(""),
  lastPublishedAt: z.string().optional().default(""),
});

export type ProposalMetadataDTO = z.infer<typeof ProposalMetadataSchema>;

// Client Info
export const ProposalClientInfoSchema = z.object({
  name: z.string().min(1, "El nombre del cliente es requerido"),
  company: z.string().optional().default(""),
  contactName: z.string().optional().default(""),
  phone: z.string().min(1, "El telefono del cliente es requerido"),
  email: z.string().email("El email debe ser valido").min(1, "El email es requerido"),
});

export type ProposalClientInfoDTO = z.infer<typeof ProposalClientInfoSchema>;

// Issuer Profile
export const ProposalIssuerProfileSchema = z.object({
  businessName: z.string().min(1, "El nombre de la empresa es requerido"),
  responsibleName: z.string().min(1, "El nombre del responsable es requerido"),
  role: z.string().min(1, "El cargo es requerido"),
  email: z.string().email("El email debe ser valido"),
  phone: z.string().optional().default(""),
  website: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().optional().default(""),
  signatureText: z.string().optional().default(""),
  signatureFont: z
    .enum([
      "script-elegant",
      "script-formal",
      "script-hand",
      "serif-classic",
      "sans-clean",
      "modern-sign",
    ])
    .default("script-elegant"),
});

export type ProposalIssuerProfileDTO = z.infer<typeof ProposalIssuerProfileSchema>;

// Investment Row
export const InvestmentRowSchema = z.object({
  id: z.string(),
  concept: z.string().min(1, "El concepto es requerido"),
  description: z.string().optional().default(""),
  quantity: z.number().min(0, "La cantidad no puede ser negativa"),
  unitPrice: z.number().min(0, "El valor unitario no puede ser negativo"),
  taxRate: z.number().min(0).max(100, "El impuesto debe estar entre 0 y 100"),
});

export type InvestmentRowDTO = z.infer<typeof InvestmentRowSchema>;

// Investment
export const ProposalInvestmentSchema = z.object({
  enabled: z.boolean().default(false),
  title: z.string().default("Inversion"),
  rows: z.array(InvestmentRowSchema).default([]),
  note: z.string().optional().default(""),
  offerValidityDays: z.number().optional().default(30),
  showTotals: z.boolean().optional().default(true),
});

export type ProposalInvestmentDTO = z.infer<typeof ProposalInvestmentSchema>;

// Section
export const ProposalSectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "El titulo de la seccion es requerido"),
  content: z.string().optional().default(""),
  kind: z.enum(["text", "bullets", "highlight", "table", "investment"]),
  isVisible: z.boolean().default(true),
});

export type ProposalSectionDTO = z.infer<typeof ProposalSectionSchema>;

// General form state (for UI)
export const GeneralFormSchema = z.object({
  title: z.string().min(1, "El titulo es requerido").max(PROPOSAL_TITLE_MAX_LENGTH, `El titulo no puede superar ${PROPOSAL_TITLE_MAX_LENGTH} caracteres`),
  clientName: z.string().min(1, "El nombre del cliente es requerido"),
  clientCompany: z.string().optional().default(""),
  clientContact: z.string().optional().default(""),
  clientPhone: z.string().min(1, "El telefono del cliente es requerido"),
  clientEmail: z.string().email("El email debe ser valido").min(1, "El email es requerido"),
  issueDate: z.string(),
  city: z.string().optional().default(""),
  currency: z.enum(["COP", "USD"]).default("COP"),
});

export type GeneralFormDTO = z.infer<typeof GeneralFormSchema>;

// Helper: compare form state for change detection
export const hasGeneralFormChanges = (original: GeneralFormDTO, current: GeneralFormDTO): boolean => {
  return (
    original.title !== current.title ||
    original.clientName !== current.clientName ||
    original.clientCompany !== current.clientCompany ||
    original.clientContact !== current.clientContact ||
    original.clientPhone !== current.clientPhone ||
    original.clientEmail !== current.clientEmail ||
    original.issueDate !== current.issueDate ||
    original.city !== current.city ||
    original.currency !== current.currency
  );
};

// Issuer form state
export const IssuerFormSchema = ProposalIssuerProfileSchema;
export type IssuerFormDTO = z.infer<typeof IssuerFormSchema>;

// Closing form state
export const ClosingFormSchema = z.object({
  closingText: z.string().optional().default(""),
  showSignature: z.boolean().default(true),
});

export type ClosingFormDTO = z.infer<typeof ClosingFormSchema>;

// Investment form state
export const InvestmentFormSchema = ProposalInvestmentSchema;
export type InvestmentFormDTO = z.infer<typeof InvestmentFormSchema>;

// Section form state (for creating/editing)
export const SectionFormSchema = z.object({
  title: z.string().min(1, "El titulo de la seccion es requerido"),
  content: z.string().optional().default(""),
  kind: z.enum(["text", "bullets", "highlight", "table", "investment"]),
});

export type SectionFormDTO = z.infer<typeof SectionFormSchema>;
