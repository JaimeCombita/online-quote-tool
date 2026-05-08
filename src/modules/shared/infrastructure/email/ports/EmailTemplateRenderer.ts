import { Proposal } from "@/modules/proposals/domain/entities/Proposal";

export interface EmailTemplateContext {
  proposal: Proposal;
  recipientName?: string;
  recipientEmail: string;
  senderName?: string;
  customMessage?: string;
  /** URL base absoluta de la aplicación para construir URLs de assets (e.g. logos) */
  appBaseUrl?: string;
}

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

/**
 * Puerto (interfaz) para renderizar plantillas de email.
 * Permite intercambiar diferentes implementaciones de templates
 * sin afectar la lógica de negocio.
 *
 * Principios SOLID aplicados:
 * - Dependency Inversion: Depende de la abstracción, no de implementaciones concretas
 * - Single Responsibility: Solo define el contrato de renderizado
 */
export interface EmailTemplateRenderer {
  render(context: EmailTemplateContext): EmailTemplate;
}
