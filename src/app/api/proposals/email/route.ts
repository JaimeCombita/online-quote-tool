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

export const runtime = "nodejs";

const EMAIL_RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_EMAIL_MAX_REQUESTS ?? "6");
const EMAIL_RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_EMAIL_WINDOW_MS ?? String(10 * 60 * 1000));
const EMAIL_PAYLOAD_MAX_BYTES = Number(process.env.EMAIL_PAYLOAD_MAX_BYTES ?? String(1_000_000));

interface SendProposalEmailPayload {
  proposal?: ProposalProps;
  to?: string;
  subject?: string;
  message?: string;
  pdfBase64?: string;
}

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

const buildDefaultMessage = (proposal: Proposal): string => {
  const snap = proposal.snapshot;
  const customer = snap.client.name;

  return [
    `Hola ${customer},`,
    "",
    "Adjunto encontrarás la propuesta comercial solicitada.",
    "",
    "Quedo atento(a) a tus comentarios.",
    "",
    `${snap.issuer.responsibleName}`,
    `${snap.issuer.role}`,
    `${snap.issuer.businessName}`,
  ].join("\n");
};

export async function POST(request: Request): Promise<Response> {
  try {
    cleanupRateLimitBuckets();

    const limitDecision = applyRateLimit(request, "api:proposals:email", {
      maxRequests: Number.isFinite(EMAIL_RATE_LIMIT_MAX_REQUESTS) ? EMAIL_RATE_LIMIT_MAX_REQUESTS : 6,
      windowMs: Number.isFinite(EMAIL_RATE_LIMIT_WINDOW_MS) ? EMAIL_RATE_LIMIT_WINDOW_MS : 10 * 60 * 1000,
    });

    if (!limitDecision.allowed) {
      return getRateLimitedResponse(limitDecision);
    }

    if (!isPayloadWithinLimit(request, EMAIL_PAYLOAD_MAX_BYTES)) {
      return getPayloadTooLargeResponse();
    }

    const payload = (await request.json()) as SendProposalEmailPayload;

    if (!payload.proposal) {
      return Response.json({ error: "El payload de la propuesta es requerido" }, { status: 400 });
    }

    if (!payload.to || !isValidEmail(payload.to)) {
      return Response.json({ error: "Debes ingresar un correo destinatario valido" }, { status: 400 });
    }

    const proposal = Proposal.rehydrate(payload.proposal);
    const validation = proposal.validateForPdf();

    if (!validation.isValid) {
      return Response.json(
        {
          error: "La propuesta no cumple los requisitos para generar/enviar PDF",
          issues: validation.issues,
        },
        { status: 400 },
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return Response.json(
        {
          error:
            "RESEND_API_KEY no esta configurada. Configura las variables de entorno antes de enviar correos.",
        },
        { status: 500 },
      );
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
    if (!fromEmail || !isValidSender(fromEmail)) {
      return Response.json(
        {
          error:
            "RESEND_FROM_EMAIL no esta configurado con un correo remitente valido.",
        },
        { status: 500 },
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fileName = `${sanitizeFileName(proposal.snapshot.metadata.title)}.pdf`;
    const attachmentBase64 = payload.pdfBase64?.trim()
      ? payload.pdfBase64.trim()
      : Buffer.from(await generateProposalPdf(proposal)).toString("base64");

    const subject =
      payload.subject?.trim() ||
      `Propuesta comercial - ${proposal.snapshot.metadata.title}`;

    const messageBody = payload.message?.trim() || buildDefaultMessage(proposal);

    const resendResult = await resend.emails.send({
      from: fromEmail,
      to: [payload.to],
      subject,
      text: messageBody,
      attachments: [
        {
          filename: fileName,
          content: attachmentBase64,
        },
      ],
      replyTo: jcBrandConfig.contact.email,
    });

    if (resendResult.error) {
      return Response.json(
        {
          error: `Resend error: ${resendResult.error.message}`,
        },
        { status: 502 },
      );
    }

    return Response.json({ ok: true, id: resendResult.data?.id ?? null }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible enviar el correo en este momento";
    return Response.json(
      { error: message },
      { status: 500 },
    );
  }
}
