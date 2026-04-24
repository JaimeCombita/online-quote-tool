import { Resend } from "resend";
import { Proposal, ProposalProps } from "@/modules/proposals/domain/entities/Proposal";
import {
  generateProposalPdf,
  sanitizeFileName,
} from "@/modules/proposals/infrastructure/pdf/proposalPdfDocument";
import { jcBrandConfig } from "@/modules/shared/branding/brand.config";

export const runtime = "nodejs";

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
    const payload = (await request.json()) as SendProposalEmailPayload;

    if (!payload.proposal) {
      return Response.json({ error: "Proposal payload is required" }, { status: 400 });
    }

    if (!payload.to || !isValidEmail(payload.to)) {
      return Response.json({ error: "A valid recipient email is required" }, { status: 400 });
    }

    const proposal = Proposal.rehydrate(payload.proposal);
    const validation = proposal.validateForPdf();

    if (!validation.isValid) {
      return Response.json(
        {
          error: "Proposal does not meet MVP PDF requirements",
          issues: validation.issues,
        },
        { status: 400 },
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return Response.json(
        {
          error:
            "RESEND_API_KEY is not configured. Configure environment variables before sending emails.",
        },
        { status: 500 },
      );
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
    if (!fromEmail || !isValidSender(fromEmail)) {
      return Response.json(
        {
          error:
            "RESEND_FROM_EMAIL is not configured with a valid sender email.",
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
    const message = error instanceof Error ? error.message : "Could not send proposal email at this time";
    return Response.json(
      { error: message },
      { status: 500 },
    );
  }
}
