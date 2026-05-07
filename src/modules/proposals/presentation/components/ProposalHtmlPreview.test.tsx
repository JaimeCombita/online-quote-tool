import { render, screen } from "@testing-library/react";
import { ProposalHtmlPreview } from "./ProposalHtmlPreview";
import { buildProposal } from "@/test/fixtures/proposalFixture";

describe("ProposalHtmlPreview", () => {
  it("renders visible content and investment summary", () => {
    const proposal = buildProposal({
      sections: [
        { id: "1", title: "Texto", content: "**Subtitulo**\nLinea 2", kind: "text", isVisible: true },
        { id: "2", title: "Oculta", content: "No se ve", kind: "text", isVisible: false },
      ],
      issuer: {
        businessName: "JC Engine",
        responsibleName: "Jaime",
        role: "Director",
        email: "hola@jcengine.com",
        phone: "+57 1",
        website: "jcengine.co",
        logoUrl: "",
        signatureText: "Firma",
        signatureFont: "script-hand",
      },
    });

    render(<ProposalHtmlPreview proposal={proposal} />);

    expect(screen.getByText("Texto")).toBeInTheDocument();
    expect(screen.getByText("Subtitulo")).toHaveClass("font-semibold", "text-sky-700");
    expect(screen.queryByText("Oculta")).not.toBeInTheDocument();
    expect(screen.getByText("Impuesto")).toBeInTheDocument();
    expect(screen.getByText("Impuestos")).toBeInTheDocument();
    expect(screen.getByText(/vigencia de la oferta/i)).toBeInTheDocument();
    expect(screen.getByText(/pagina 1 de/i)).toBeInTheDocument();
  });

  it("hides tax column and tax totals when all tax rates are zero", () => {
    const proposal = buildProposal({
      investment: {
        enabled: true,
        title: "Inversion",
        rows: [
          {
            id: "row-1",
            concept: "Servicio",
            description: "Desc",
            quantity: 1,
            unitPrice: 100,
            taxRate: 0,
          },
        ],
        note: "",
        offerValidityDays: 30,
        showTotals: true,
      },
    });

    render(<ProposalHtmlPreview proposal={proposal} />);

    expect(screen.queryByText("Impuesto")).toBeNull();
    expect(screen.queryByText("Impuestos")).toBeNull();
  });

  it("hides totals section when configured", () => {
    const proposal = buildProposal({
      investment: {
        enabled: true,
        title: "Inversion",
        rows: [
          {
            id: "row-1",
            concept: "Servicio",
            description: "Desc",
            quantity: 1,
            unitPrice: 100,
            taxRate: 19,
          },
        ],
        note: "",
        offerValidityDays: 30,
        showTotals: false,
      },
    });

    render(<ProposalHtmlPreview proposal={proposal} />);

    expect(screen.queryByText("Subtotal")).toBeNull();
    expect(screen.queryByText("Impuestos")).toBeNull();
  });
});
