import { Proposal, ProposalProps } from "@/modules/proposals/domain/entities/Proposal";
import {
  generateProposalPdf,
  sanitizeFileName,
} from "@/modules/proposals/infrastructure/pdf/proposalPdfDocument";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { proposal?: ProposalProps };

    if (!body.proposal) {
      return Response.json({ error: "Proposal payload is required" }, { status: 400 });
    }

    const proposal = Proposal.rehydrate(body.proposal);
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
      { error: "Could not generate PDF at this time" },
      { status: 500 },
    );
  }
}
