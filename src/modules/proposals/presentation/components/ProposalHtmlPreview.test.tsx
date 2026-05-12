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

  it("renders fallback row for table sections without body rows", () => {
    const proposal = buildProposal({
      sections: [
        {
          id: "table-1",
          title: "Tabla",
          content: "Columna A|Columna B",
          kind: "table",
          isVisible: true,
        },
      ],
    });

    render(<ProposalHtmlPreview proposal={proposal} />);

    expect(screen.getByText("Sin filas en la tabla")).toBeInTheDocument();
  });

  it("renders normalized bullet lines inside text sections", () => {
    const proposal = buildProposal({
      sections: [
        {
          id: "text-1",
          title: "Texto",
          content: "Linea normal\n- Primer punto\n• Segundo punto",
          kind: "text",
          isVisible: true,
        },
      ],
      showSignature: false,
    });

    render(<ProposalHtmlPreview proposal={proposal} />);

    expect(screen.getByText("Linea normal")).toBeInTheDocument();
    expect(screen.getByText("• Primer punto")).toBeInTheDocument();
    expect(screen.getByText("• Segundo punto")).toBeInTheDocument();
  });

  it("renders investment empty-state row and note lines", () => {
    const proposal = buildProposal({
      investment: {
        enabled: true,
        title: "Inversion",
        rows: [],
        note: "Nota uno\nNota dos",
        offerValidityDays: 15,
        showTotals: true,
      },
    });

    render(<ProposalHtmlPreview proposal={proposal} />);

    expect(screen.getByText("Sin filas en la inversion")).toBeInTheDocument();
    expect(screen.getByText("Nota uno")).toBeInTheDocument();
    expect(screen.getByText("Nota dos")).toBeInTheDocument();
  });
});
