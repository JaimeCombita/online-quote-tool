import { EmailTemplate, EmailTemplateContext, EmailTemplateRenderer } from "../ports/EmailTemplateRenderer";
import { jcBrandConfig } from "../../../branding/brand.config";

/**
 * Implementación del template de email corporativo.
 * Proporciona un HTML profesional y responsive para emails de propuestas.
 *
 * Principios SOLID aplicados:
 * - Open/Closed: Extensible sin modificar código existente (heredar esta clase)
 * - Single Responsibility: Solo renderiza el template HTML
 * - Liskov Substitution: Implementa el contrato EmailTemplateRenderer
 */
export class CorporativeEmailTemplate implements EmailTemplateRenderer {
  render(context: EmailTemplateContext): EmailTemplate {
    const { proposal, recipientName, recipientEmail, senderName, customMessage } = context;
    const snap = proposal.snapshot;
    const issuer = snap.issuer;
    const client = snap.client;
    const metadata = snap.metadata;

    const appBaseUrl = context.appBaseUrl ?? "";
    const logoAbsoluteUrl = appBaseUrl
      ? `${appBaseUrl}${jcBrandConfig.assets.logoMain}`
      : jcBrandConfig.assets.logoMain;

    // Número de WhatsApp: solo dígitos, listo para wa.me
    const whatsappPhone = issuer.phone?.replace(/\D/g, "") ?? "";

    const htmlBody = this.buildHtmlBody({
      clientName: recipientName || client.contactName || client.name,
      issuerName: issuer.businessName,
      issuerResponsible: senderName || issuer.responsibleName,
      issuerRole: issuer.role,
      issuerEmail: issuer.email,
      issuerPhone: issuer.phone,
      issuerWebsite: issuer.website,
      proposalTitle: metadata.title,
      customMessage: customMessage,
      logoUrl: logoAbsoluteUrl,
      brandColor: "#0f5ea6", // JC Engine primary-700
      brandPrimaryColor: "#1e90ff", // JC Engine primary-500
      whatsappPhone,
    });

    const subject = `Propuesta comercial: ${metadata.title}`;
    const textBody = this.buildTextBody({
      clientName: recipientName || client.name,
      issuerResponsible: senderName || issuer.responsibleName,
      issuerRole: issuer.role,
      issuerBusinessName: issuer.businessName,
      proposalTitle: metadata.title,
      customMessage: customMessage,
    });

    return {
      subject,
      htmlBody,
      textBody,
    };
  }

  private buildHtmlBody(context: {
    clientName: string;
    issuerName: string;
    issuerResponsible: string;
    issuerRole: string;
    issuerEmail: string;
    issuerPhone?: string;
    issuerWebsite?: string;
    proposalTitle: string;
    customMessage?: string;
    logoUrl: string;
    brandColor: string;
    brandPrimaryColor: string;
    whatsappPhone: string;
  }): string {
    const {
      clientName,
      issuerName,
      issuerResponsible,
      issuerRole,
      issuerEmail,
      issuerPhone,
      issuerWebsite,
      proposalTitle,
      customMessage,
      logoUrl,
      brandColor,
      whatsappPhone,
    } = context;

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${proposalTitle}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #334155;
      background-color: #f8fafc;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    
    .header {
      background: linear-gradient(160deg, #0f5ea6 0%, #0f172a 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    
    .header-logo {
      display: inline-block;
      margin-bottom: 16px;
      max-width: 56px;
      height: auto;
      border-radius: 10px;
      background: rgba(255,255,255,0.12);
      padding: 6px;
    }
    
    .header-tag {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      opacity: 0.65;
      margin-bottom: 10px;
    }

    .header h1 {
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 10px;
      letter-spacing: -0.5px;
    }
    
    .header-proposal-title {
      font-size: 15px;
      font-weight: 500;
      opacity: 0.88;
      background: rgba(255,255,255,0.10);
      display: inline-block;
      padding: 4px 14px;
      border-radius: 20px;
      margin-top: 4px;
    }
    
    .content {
      padding: 40px 30px;
    }
    
    .greeting {
      font-size: 16px;
      margin-bottom: 24px;
      color: #1e293b;
    }
    
    .greeting strong {
      color: ${brandColor};
    }
    
    .message-section {
      margin: 24px 0;
      padding: 20px;
      background-color: #f0f9ff;
      border-radius: 6px;
      border: 1px solid #e0f2fe;
    }
    
    .message-section p {
      margin-bottom: 12px;
      line-height: 1.7;
      color: #1e293b;
    }
    
    .message-section p:last-child {
      margin-bottom: 0;
    }
    
    .divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 32px 0;
    }
    
    .issuer-section {
      background-color: #f8fafc;
      padding: 24px;
      border-radius: 6px;
      margin: 24px 0;
    }
    
    .issuer-title {
      font-size: 12px;
      font-weight: 700;
      color: ${brandColor};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    
    .issuer-name {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
    }
    
    .issuer-info {
      font-size: 14px;
      color: #475569;
      line-height: 1.8;
    }
    
    .issuer-info a {
      color: ${brandColor};
      text-decoration: none;
    }
    
    .issuer-info a:hover {
      text-decoration: underline;
    }
    
    .cta-section {
      margin: 24px 0;
      padding: 20px;
      background-color: #ecf0f1;
      border-radius: 6px;
      text-align: center;
    }
    
    .cta-section p {
      font-size: 14px;
      color: #475569;
      margin-bottom: 12px;
    }
    
    .cta-button {
      display: inline-block;
      background-color: ${brandColor};
      color: white;
      padding: 12px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      transition: background-color 0.2s;
    }
    
    .cta-button:hover {
      background-color: #0259a1;
    }
    
    .footer {
      background-color: #1e293b;
      color: #cbd5e1;
      padding: 30px;
      text-align: center;
      font-size: 12px;
      line-height: 1.8;
      border-top: 1px solid #334155;
    }
    
    .footer a {
      color: #94a3b8;
      text-decoration: none;
    }
    
    .footer a:hover {
      color: #cbd5e1;
      text-decoration: underline;
    }
    
    .footer-divider {
      height: 1px;
      background-color: #334155;
      margin: 16px 0;
    }
    
    .legal-notice {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #334155;
      font-size: 11px;
      color: #64748b;
    }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .content {
        padding: 24px 16px;
      }
      
      .header {
        padding: 28px 16px;
      }
      
      .header h1 {
        font-size: 22px;
      }
      
      .issuer-section {
        padding: 16px;
      }
      
      .footer {
        padding: 20px 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <img src="${logoUrl}" alt="JC Engine" class="header-logo">
      <p class="header-tag">Propuesta Comercial</p>
      <h1>${issuerName}</h1>
      <p class="header-proposal-title">${proposalTitle}</p>
    </div>
    
    <!-- Content -->
    <div class="content">
      <!-- Greeting -->
      <div class="greeting">
        Hola <strong>${clientName}</strong>,
      </div>
      
      <!-- Custom Message or Default -->
      ${
        customMessage
          ? `
      <div class="message-section">
        ${customMessage
          .split("\n")
          .map((line) => `<p>${line || "<br>"}</p>`)
          .join("")}
      </div>
      `
          : `
      <div class="message-section">
        <p>Adjunto encontrarás la propuesta comercial que solicitaste. En ella podrás revisar todos los detalles, términos y condiciones de nuestras soluciones.</p>
        <p>Si tienes cualquier pregunta o necesitas aclaraciones, no dudes en contactarme. Estoy disponible para discutir cualquier aspecto de esta propuesta.</p>
      </div>
      `
      }
      
      <div class="divider"></div>
      
      <!-- Issuer Section -->
      <div class="issuer-section">
        <div class="issuer-title">Contacto</div>
        <div class="issuer-name">${issuerResponsible}</div>
        <div class="issuer-info">
          <strong>${issuerRole}</strong><br>
          ${issuerName}<br>
          <br>
          &#128231; <a href="mailto:${issuerEmail}">${issuerEmail}</a><br>
          ${issuerPhone ? `&#128241; <a href="tel:${issuerPhone}">${issuerPhone}</a><br>` : ""}
          ${issuerWebsite ? `&#127760; <a href="${issuerWebsite}" target="_blank" rel="noreferrer">${issuerWebsite}</a><br>` : ""}
        </div>
        ${whatsappPhone ? `
        <div style="margin-top:20px;">
          <a href="https://wa.me/${whatsappPhone}" target="_blank" rel="noreferrer"
             style="display:inline-flex;align-items:center;gap:8px;background-color:#25D366;color:#ffffff;padding:11px 22px;border-radius:8px;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:700;letter-spacing:0.01em;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            Contactar por WhatsApp
          </a>
        </div>` : ""}
      </div>
      
      <!-- CTA Section -->
      <div class="cta-section">
        <p>¿Preguntas sobre la propuesta?</p>
        <a href="mailto:${issuerEmail}" class="cta-button">Responder</a>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p style="margin-bottom: 12px; font-weight: 600;">© ${new Date().getFullYear()} ${issuerName}</p>
      <p>Propuesta generada por JC Engine</p>
      <div class="footer-divider"></div>
      <div class="legal-notice">
        <p>Este correo contiene información confidencial. Si no eres el destinatario, se te solicita respetuosamente que no leas, distribuyas ni tomes acciones basadas en este mensaje.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private buildTextBody(context: {
    clientName: string;
    issuerResponsible: string;
    issuerRole: string;
    issuerBusinessName: string;
    proposalTitle: string;
    customMessage?: string;
  }): string {
    const {
      clientName,
      issuerResponsible,
      issuerRole,
      issuerBusinessName,
      proposalTitle,
      customMessage,
    } = context;

    const lines = [
      `Hola ${clientName},`,
      "",
      `PROPUESTA: ${proposalTitle}`,
      "",
      customMessage
        ? customMessage
        : [
            "Adjunto encontrarás la propuesta comercial que solicitaste.",
            "",
            "Si tienes cualquier pregunta o necesitas aclaraciones, no dudes en contactarme.",
          ].join("\n"),
      "",
      "---",
      "",
      `${issuerResponsible}`,
      `${issuerRole}`,
      issuerBusinessName,
    ];

    return lines.join("\n");
  }
}
