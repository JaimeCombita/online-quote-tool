import {
  applyRateLimit,
  cleanupRateLimitBuckets,
  getPayloadTooLargeResponse,
  getRateLimitedResponse,
  isPayloadWithinLimit,
} from "@/modules/shared/infrastructure/security/requestGuards";
import {
  buildWhatsAppUrl,
  normalizePhoneForColombia,
  sanitizeWhatsAppText,
} from "@/modules/proposals/application/utils/phone";

export const runtime = "nodejs";

const WP_RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_WP_MAX_REQUESTS ?? "20");
const WP_RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WP_WINDOW_MS ?? String(5 * 60 * 1000));
const WP_PAYLOAD_MAX_BYTES = Number(process.env.WP_PAYLOAD_MAX_BYTES ?? String(200_000));

interface SendWpPayload {
  phone?: string;
  message?: string;
  proposalId?: string;
}

const buildDefaultMessage = (proposalId?: string): string => {
  if (!proposalId) {
    return "Hola, comparto la propuesta comercial solicitada.";
  }
  return `Hola, comparto la propuesta comercial (${proposalId}).`;
};

export async function POST(request: Request): Promise<Response> {
  try {
    cleanupRateLimitBuckets();

    const limitDecision = applyRateLimit(request, "api:proposals:wp", {
      maxRequests: Number.isFinite(WP_RATE_LIMIT_MAX_REQUESTS) ? WP_RATE_LIMIT_MAX_REQUESTS : 20,
      windowMs: Number.isFinite(WP_RATE_LIMIT_WINDOW_MS) ? WP_RATE_LIMIT_WINDOW_MS : 5 * 60 * 1000,
    });

    if (!limitDecision.allowed) {
      return getRateLimitedResponse(limitDecision);
    }

    if (!isPayloadWithinLimit(request, WP_PAYLOAD_MAX_BYTES)) {
      return getPayloadTooLargeResponse();
    }

    const payload = (await request.json()) as SendWpPayload;
    const normalizedPhone = normalizePhoneForColombia(payload.phone ?? "");

    if (!normalizedPhone) {
      return Response.json({ error: "Numero de telefono invalido para WhatsApp" }, { status: 400 });
    }

    const message = sanitizeWhatsAppText(payload.message ?? buildDefaultMessage(payload.proposalId));
    if (!message) {
      return Response.json({ error: "El mensaje de WhatsApp es requerido" }, { status: 400 });
    }

    const whatsappUrl = buildWhatsAppUrl(normalizedPhone, message);

    return Response.json(
      {
        ok: true,
        normalizedPhone,
        whatsappUrl,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible preparar el envio por WhatsApp";
    return Response.json({ error: message }, { status: 500 });
  }
}
