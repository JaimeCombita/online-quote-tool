import { Proposal, ProposalProps } from "@/modules/proposals/domain/entities/Proposal";
import {
  generateProposalPdf,
  sanitizeFileName,
} from "@/modules/proposals/infrastructure/pdf/proposalPdfDocument";
import {
  applyRateLimit,
  cleanupRateLimitBuckets,
  getPayloadTooLargeResponse,
  getRateLimitedResponse,
  isPayloadWithinLimit,
} from "@/modules/shared/infrastructure/security/requestGuards";

export const runtime = "nodejs";

const PDF_RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_PDF_MAX_REQUESTS ?? "20");
const PDF_RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_PDF_WINDOW_MS ?? String(5 * 60 * 1000));
const PDF_PAYLOAD_MAX_BYTES = Number(process.env.PDF_PAYLOAD_MAX_BYTES ?? String(1_000_000));

export async function POST(request: Request): Promise<Response> {
  try {
    cleanupRateLimitBuckets();

    const limitDecision = applyRateLimit(request, "api:proposals:pdf", {
      maxRequests: Number.isFinite(PDF_RATE_LIMIT_MAX_REQUESTS) ? PDF_RATE_LIMIT_MAX_REQUESTS : 20,
      windowMs: Number.isFinite(PDF_RATE_LIMIT_WINDOW_MS) ? PDF_RATE_LIMIT_WINDOW_MS : 5 * 60 * 1000,
    });

    if (!limitDecision.allowed) {
      return getRateLimitedResponse(limitDecision);
    }

    if (!isPayloadWithinLimit(request, PDF_PAYLOAD_MAX_BYTES)) {
      return getPayloadTooLargeResponse();
    }

    const body = (await request.json()) as { proposal?: ProposalProps };

    if (!body.proposal) {
      return Response.json({ error: "El payload de la propuesta es requerido" }, { status: 400 });
    }

    const proposal = Proposal.rehydrate(body.proposal);
    const validation = proposal.validateForPdf();

    if (!validation.isValid) {
      return Response.json(
        {
          error: "La propuesta no cumple los requisitos para generar PDF",
          issues: validation.issues,
        },
        { status: 400 },
      );
    }

    const bytes = await generateProposalPdf(proposal);
    const fileName = sanitizeFileName(proposal.snapshot.metadata.title);

    const pdfBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return Response.json(
      { error: "No fue posible generar el PDF en este momento" },
      { status: 500 },
    );
  }
}
