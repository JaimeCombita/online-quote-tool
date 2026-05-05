import { render, screen } from "@testing-library/react";
import { ProposalPdfReadinessPanel } from "./ProposalPdfReadinessPanel";

describe("ProposalPdfReadinessPanel", () => {
  it("renders compact success badge", () => {
    render(
      <ProposalPdfReadinessPanel
        compact={true}
        validation={{ isValid: true, issues: [] }}
      />,
    );

    expect(screen.getByText("Lista para PDF")).toBeInTheDocument();
  });

  it("renders full issues when invalid", () => {
    render(
      <ProposalPdfReadinessPanel
        validation={{
          isValid: false,
          issues: [
            { code: "missing-title", message: "Falta titulo" },
            { code: "missing-client-name", message: "Falta cliente" },
          ],
        }}
      />,
    );

    expect(screen.getByText("Pendiente de completar")).toBeInTheDocument();
    expect(screen.getByText("Falta titulo")).toBeInTheDocument();
    expect(screen.getByText("Falta cliente")).toBeInTheDocument();
  });
});
