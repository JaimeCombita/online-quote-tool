import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ProposalModuleBootstrap } from "./ProposalModuleBootstrap";
import { buildProposal } from "@/test/fixtures/proposalFixture";

const mockModule = {
  listProposalDrafts: { execute: vi.fn() },
  createProposalDraft: { execute: vi.fn() },
};

vi.mock("../../composition/proposalModule", () => ({
  createProposalModule: () => mockModule,
}));

describe("ProposalModuleBootstrap", () => {
  it("creates and refreshes draft list", async () => {
    mockModule.createProposalDraft.execute.mockResolvedValue(buildProposal());
    mockModule.listProposalDrafts.execute.mockResolvedValue([buildProposal()]);

    render(<ProposalModuleBootstrap />);

    fireEvent.click(screen.getByRole("button", { name: /crear borrador de prueba/i }));

    await waitFor(() => {
      expect(mockModule.createProposalDraft.execute).toHaveBeenCalled();
      expect(mockModule.listProposalDrafts.execute).toHaveBeenCalled();
    });
  });

  it("refreshes draft list without creating", async () => {
    mockModule.listProposalDrafts.execute.mockResolvedValue([buildProposal()]);

    render(<ProposalModuleBootstrap />);
    fireEvent.click(screen.getByRole("button", { name: /actualizar listado/i }));

    await waitFor(() => expect(mockModule.listProposalDrafts.execute).toHaveBeenCalled());
    expect(screen.getByText(/1 registrados/i)).toBeInTheDocument();
  });

  it("reads pre-existing drafts from localStorage", () => {
    const snapshot = { id: "stored-id" };
    window.localStorage.setItem(
      "propuestas-pdf:drafts",
      JSON.stringify([snapshot]),
    );

    render(<ProposalModuleBootstrap />);

    expect(screen.getByText(/1 registrados/i)).toBeInTheDocument();
    expect(screen.getByText(/stored-id/)).toBeInTheDocument();

    window.localStorage.removeItem("propuestas-pdf:drafts");
  });
});
