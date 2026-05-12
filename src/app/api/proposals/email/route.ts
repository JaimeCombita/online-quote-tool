import { Resend } from "resend";
import { Proposal, ProposalProps } from "@/modules/proposals/domain/entities/Proposal";
import {
  generateProposalPdf,
  sanitizeFileName,
} from "@/modules/proposals/infrastructure/pdf/proposalPdfDocument";
import { jcBrandConfig } from "@/modules/shared/branding/brand.config";
import {
  applyRateLimit,
  cleanupRateLimitBuckets,
  getPayloadTooLargeResponse,
  getRateLimitedResponse,
  isPayloadWithinLimit,
} from "@/modules/shared/infrastructure/security/requestGuards";
import {
  telemetryDuration,
  telemetryNow,
  trackTelemetry,
} from "@/modules/shared/infrastructure/observability/telemetry";
import { CorporativeEmailTemplate, ProposalEmailService } from "@/modules/shared/infrastructure/email";

export const runtime = "nodejs";

const EMAIL_RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_EMAIL_MAX_REQUESTS ?? "6");
const EMAIL_RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_EMAIL_WINDOW_MS ?? String(10 * 60 * 1000));
const EMAIL_PAYLOAD_MIN_BYTES = 8_000_000;
const EMAIL_PAYLOAD_MAX_BYTES = Math.max(
  Number(process.env.EMAIL_PAYLOAD_MAX_BYTES ?? String(EMAIL_PAYLOAD_MIN_BYTES)),
  EMAIL_PAYLOAD_MIN_BYTES,
);

interface SendProposalEmailPayload {
  proposal?: ProposalProps;
  to?: string;
  subject?: string;
  message?: string;
  recipientName?: string;
  senderName?: string;
  pdfBase64?: string;
}

// Composición: inyección de dependencias
const emailTemplateRenderer = new CorporativeEmailTemplate();
const emailService = new ProposalEmailService(emailTemplateRenderer);

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isValidSender = (value: string): boolean => {
  const trimmed = value.trim();
  if (isValidEmail(trimmed)) {
    return true;
  }

  const match = trimmed.match(/<([^>]+)>$/);
  if (!match) {
    return false;
  }

  return isValidEmail(match[1].trim());
};

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, "");

const isLocalhostUrl = (value: string): boolean => /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value);

export async function POST(request: Request): Promise<Response> {
  const startedAt = telemetryNow();
  let proposalContext: { proposalId?: string; version?: number } = {};

  try {
    cleanupRateLimitBuckets();

    const limitDecision = applyRateLimit(request, "api:proposals:email", {
      maxRequests: Number.isFinite(EMAIL_RATE_LIMIT_MAX_REQUESTS) ? EMAIL_RATE_LIMIT_MAX_REQUESTS : 6,
      windowMs: Number.isFinite(EMAIL_RATE_LIMIT_WINDOW_MS) ? EMAIL_RATE_LIMIT_WINDOW_MS : 10 * 60 * 1000,
    });

    if (!limitDecision.allowed) {
      trackTelemetry({
        scope: "api.proposals.email",
        action: "send-email",
        outcome: "rejected",
        statusCode: 429,
        durationMs: telemetryDuration(startedAt),
        detail: "rate-limited",
      });
      return getRateLimitedResponse(limitDecision);
    }

    if (!isPayloadWithinLimit(request, EMAIL_PAYLOAD_MAX_BYTES)) {
      trackTelemetry({
        scope: "api.proposals.email",
        action: "send-email",
        outcome: "rejected",
        statusCode: 413,
        durationMs: telemetryDuration(startedAt),
        detail: "payload-too-large",
      });
      return getPayloadTooLargeResponse();
    }

    const payload = (await request.json()) as SendProposalEmailPayload;

    // Validaciones básicas
    if (!payload.proposal) {
      trackTelemetry({
        scope: "api.proposals.email",
        action: "send-email",
        outcome: "rejected",
        statusCode: 400,
        durationMs: telemetryDuration(startedAt),
        detail: "missing-proposal-payload",
      });
      return Response.json({ error: "El payload de la propuesta es requerido" }, { status: 400 });
    }

    if (!payload.to || !isValidEmail(payload.to)) {
      trackTelemetry({
        scope: "api.proposals.email",
        action: "send-email",
        outcome: "rejected",
        statusCode: 400,
        durationMs: telemetryDuration(startedAt),
        detail: "invalid-recipient-email",
      });
      return Response.json({ error: "Debes ingresar un correo destinatario válido" }, { status: 400 });
    }

    // Rehydratación y validación de propuesta
    const proposal = Proposal.rehydrate(payload.proposal);
    proposalContext = {
      proposalId: proposal.snapshot.id,
      version: proposal.snapshot.metadata.version ?? 1,
    };
    const validation = proposal.validateForPdf();

    if (!validation.isValid) {
      trackTelemetry({
        scope: "api.proposals.email",
        action: "send-email",
        outcome: "rejected",
        proposalId: proposalContext.proposalId,
        version: proposalContext.version,
        statusCode: 400,
        durationMs: telemetryDuration(startedAt),
        detail: "proposal-validation-failed",
      });
      return Response.json(
        {
          error: "La propuesta no cumple los requisitos para generar/enviar PDF",
          issues: validation.issues,
        },
        { status: 400 },
      );
    }

    // Validaciones de configuración
    if (!process.env.RESEND_API_KEY) {
      trackTelemetry({
        scope: "api.proposals.email",
        action: "send-email",
        outcome: "error",
        proposalId: proposalContext.proposalId,
        version: proposalContext.version,
        statusCode: 500,
        durationMs: telemetryDuration(startedAt),
        detail: "missing-resend-api-key",
      });
      return Response.json(
        {
          error:
            "RESEND_API_KEY no está configurada. Configura las variables de entorno antes de enviar correos.",
        },
        { status: 500 },
      );
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
    if (!fromEmail || !isValidSender(fromEmail)) {
      trackTelemetry({
        scope: "api.proposals.email",
        action: "send-email",
        outcome: "error",
        proposalId: proposalContext.proposalId,
        version: proposalContext.version,
        statusCode: 500,
        durationMs: telemetryDuration(startedAt),
        detail: "invalid-from-email",
      });
      return Response.json(
        {
          error:
            "RESEND_FROM_EMAIL no está configurado con un correo remitente válido.",
        },
        { status: 500 },
      );
    }

    // Resolución de URL base para assets (logo) en el cuerpo del email
    const requestOrigin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return "";
      }
    })();

    const configuredBaseUrl =
      process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
      process.env.PUBLIC_APP_BASE_URL?.trim() ||
      jcBrandConfig.links.website;

    const appBaseUrl = !isLocalhostUrl(requestOrigin)
      ? normalizeBaseUrl(requestOrigin)
      : normalizeBaseUrl(configuredBaseUrl);

    const snap = proposal.snapshot;

    // Generación del email usando el servicio
    const emailResult = emailService.generateProposalEmail({
      proposal,
      recipientEmail: payload.to,
      recipientName: snap.client.contactName?.trim() || snap.client.name,
      senderName: undefined,
      customMessage: payload.message?.trim(),
      overrideSubject: payload.subject?.trim(),
      appBaseUrl,
    });

    // Generación del PDF
    const attachmentBase64 = payload.pdfBase64?.trim()
      ? payload.pdfBase64.trim()
      : Buffer.from(await generateProposalPdf(proposal)).toString("base64");

    // Envío del email
    const resend = new Resend(process.env.RESEND_API_KEY);
    const resendResult = await resend.emails.send({
      from: fromEmail,
      to: [payload.to],
      subject: emailResult.subject,
      html: emailResult.template.htmlBody,
      text: emailResult.template.textBody,
      attachments: [
        {
          filename: emailResult.fileName,
          content: attachmentBase64,
        },
      ],
      replyTo: jcBrandConfig.contact.email,
    });

    if (resendResult.error) {
      trackTelemetry({
        scope: "api.proposals.email",
        action: "send-email",
        outcome: "error",
        proposalId: proposalContext.proposalId,
        version: proposalContext.version,
        statusCode: 502,
        durationMs: telemetryDuration(startedAt),
        detail: `resend-error:${resendResult.error.message}`,
      });
      return Response.json(
        {
          error: `Resend error: ${resendResult.error.message}`,
        },
        { status: 502 },
      );
    }

    trackTelemetry({
      scope: "api.proposals.email",
      action: "send-email",
      outcome: "success",
      proposalId: proposalContext.proposalId,
      version: proposalContext.version,
      statusCode: 200,
      durationMs: telemetryDuration(startedAt),
      metadata: {
        usedClientPdfPayload: Boolean(payload.pdfBase64?.trim()),
      },
    });

    return Response.json({ ok: true, id: resendResult.data?.id ?? null }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible enviar el correo en este momento";
    trackTelemetry({
      scope: "api.proposals.email",
      action: "send-email",
      outcome: "error",
      proposalId: proposalContext.proposalId,
      version: proposalContext.version,
      statusCode: 500,
      durationMs: telemetryDuration(startedAt),
      detail: message,
    });
    return Response.json(
      { error: message },
      { status: 500 },
    );
  }
}
