/**
 * Módulo de Email - Composición e inyección de dependencias
 *
 * Exporta las clases e interfaces necesarias para trabajar con emails
 * de propuestas comerciales de forma modular y extensible.
 *
 * Arquitectura:
 * - Ports: EmailTemplateRenderer (interfaz)
 * - Templates: CorporativeEmailTemplate (implementación)
 * - Services: ProposalEmailService (orquestación)
 *
 * Uso:
 * ```typescript
 * const templateRenderer = new CorporativeEmailTemplate();
 * const emailService = new ProposalEmailService(templateRenderer);
 * const result = emailService.generateProposalEmail(payload);
 * ```
 */

export type { EmailTemplate, EmailTemplateContext, EmailTemplateRenderer } from "./ports/EmailTemplateRenderer";
export { CorporativeEmailTemplate } from "./templates/CorporativeEmailTemplate";
export { ProposalEmailService, type ProposalEmailPayload, type ProposalEmailResult } from "./services/ProposalEmailService";
