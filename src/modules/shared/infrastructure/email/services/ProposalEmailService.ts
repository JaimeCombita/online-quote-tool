import { Proposal } from "@/modules/proposals/domain/entities/Proposal";
import { EmailTemplate, EmailTemplateContext, EmailTemplateRenderer } from "../ports/EmailTemplateRenderer";

export interface ProposalEmailPayload {
  proposal: Proposal;
  recipientEmail: string;
  recipientName?: string;
  senderName?: string;
  customMessage?: string;
  overrideSubject?: string;
  /** URL base absoluta de la app para construir URLs absolutas de assets */
  appBaseUrl?: string;
}

export interface ProposalEmailResult {
  template: EmailTemplate;
  fileName: string;
  subject: string;
  recipientEmail: string;
}

/**
 * Servicio que orquesta la creación de emails de propuestas.
 * Actúa como fachada entre la API y el template renderer.
 *
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo orquesta la creación del email
 * - Dependency Inversion: Acepta cualquier implementación de EmailTemplateRenderer
 * - Interface Segregation: Interfaces específicas y pequeñas (EmailTemplateRenderer, ProposalEmailPayload)
 */
export class ProposalEmailService {
  constructor(private templateRenderer: EmailTemplateRenderer) {}

  /**
   * Genera un email corporativo a partir de una propuesta.
   * @param payload - Datos necesarios para generar el email
   * @returns Resultado con template generado y metadata
   */
  generateProposalEmail(payload: ProposalEmailPayload): ProposalEmailResult {
    this.validatePayload(payload);

    const context: EmailTemplateContext = {
      proposal: payload.proposal,
      recipientName: payload.recipientName,
      recipientEmail: payload.recipientEmail,
      senderName: payload.senderName,
      customMessage: payload.customMessage,
      appBaseUrl: payload.appBaseUrl,
    };

    const template = this.templateRenderer.render(context);

    return {
      template,
      fileName: this.generateFileName(payload.proposal),
      subject: payload.overrideSubject || template.subject,
      recipientEmail: payload.recipientEmail,
    };
  }

  /**
   * Valida que el payload contenga los datos mínimos requeridos.
   * @throws Error si la validación falla
   */
  private validatePayload(payload: ProposalEmailPayload): void {
    if (!payload.proposal) {
      throw new Error("La propuesta es requerida");
    }

    if (!payload.recipientEmail) {
      throw new Error("El email destinatario es requerido");
    }

    if (!this.isValidEmail(payload.recipientEmail)) {
      throw new Error("El email destinatario no es válido");
    }
  }

  /**
   * Valida el formato de un email.
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Genera un nombre de archivo sanitizado para la propuesta.
   */
  private generateFileName(proposal: Proposal): string {
    const title = proposal.snapshot.metadata.title;
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") + ".pdf";
  }
}
