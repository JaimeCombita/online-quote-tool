import { render, screen } from "@testing-library/react";
import { ProposalHtmlPreview } from "./ProposalHtmlPreview";
import { buildProposal } from "@/test/fixtures/proposalFixture";

describe("ProposalHtmlPreview", () => {
  it("renders visible content and investment summary", () => {
    const proposal = buildProposal({
      sections: [
        { id: "1", title: "Texto", content: "Linea 1\nLinea 2", kind: "text", isVisible: true },
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
    expect(screen.queryByText("Oculta")).not.toBeInTheDocument();
    expect(screen.getByText(/vigencia de la oferta/i)).toBeInTheDocument();
    expect(screen.getByText(/pagina 1 de/i)).toBeInTheDocument();
  });
});
