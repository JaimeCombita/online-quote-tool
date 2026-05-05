import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ProposalDashboard } from "./ProposalDashboard";
import { buildProposal, buildProposalSnapshot } from "@/test/fixtures/proposalFixture";

const mockModule = {
  listProposalDrafts: { execute: vi.fn() },
  createProposalDraft: { execute: vi.fn() },
  updateProposalDraft: { execute: vi.fn() },
  deleteProposalDraft: { execute: vi.fn() },
  exportProposal: { execute: vi.fn() },
  importProposal: { execute: vi.fn() },
};

vi.mock("../../composition/proposalModule", () => ({
  createProposalModule: () => mockModule,
}));

describe("ProposalDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModule.listProposalDrafts.execute.mockResolvedValue([]);
    mockModule.createProposalDraft.execute.mockResolvedValue(buildProposal());
    mockModule.updateProposalDraft.execute.mockResolvedValue(buildProposal());
    mockModule.deleteProposalDraft.execute.mockResolvedValue(undefined);
    mockModule.exportProposal.execute.mockResolvedValue(JSON.stringify(buildProposalSnapshot()));
    mockModule.importProposal.execute.mockResolvedValue(buildProposal());
  });

  it("renders empty state and creates draft", async () => {
    render(<ProposalDashboard />);

    expect(await screen.findByText(/no hay propuestas todavia/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /nueva propuesta/i }));

    await waitFor(() => {
      expect(mockModule.createProposalDraft.execute).toHaveBeenCalled();
      expect(mockModule.updateProposalDraft.execute).toHaveBeenCalled();
    });
  });

  it("renders existing draft and deletes it", async () => {
    mockModule.listProposalDrafts.execute.mockResolvedValueOnce([buildProposal()]);
    render(<ProposalDashboard />);

    expect(await screen.findByText("Propuesta QA")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(mockModule.deleteProposalDraft.execute).toHaveBeenCalled());
  });

  it("exports single proposal JSON", async () => {
    mockModule.listProposalDrafts.execute.mockResolvedValueOnce([buildProposal()]);
    render(<ProposalDashboard />);

    await screen.findByText("Propuesta QA");
    fireEvent.click(screen.getByRole("button", { name: "Exportar JSON" }));

    await waitFor(() => expect(mockModule.exportProposal.execute).toHaveBeenCalled());
  });

  it("opens and closes company settings modal", async () => {
    render(<ProposalDashboard />);
    await screen.findByText(/no hay propuestas/i);

    fireEvent.click(screen.getByRole("button", { name: /configuracion empresa/i }));
    expect(screen.getByRole("heading", { name: /configuracion general de empresa/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("heading", { name: /configuracion general de empresa/i })).toBeNull();
  });

  it("shows edit link for draft", async () => {
    mockModule.listProposalDrafts.execute.mockResolvedValueOnce([buildProposal()]);
    render(<ProposalDashboard />);

    await screen.findByText("Propuesta QA");
    expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute("href", "/editor/proposal-1");
  });
});

describe("ProposalDashboard - extra branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModule.listProposalDrafts.execute.mockResolvedValue([]);
    mockModule.createProposalDraft.execute.mockResolvedValue(buildProposal());
    mockModule.updateProposalDraft.execute.mockResolvedValue(buildProposal());
    mockModule.deleteProposalDraft.execute.mockResolvedValue(undefined);
    mockModule.exportProposal.execute.mockResolvedValue(JSON.stringify(buildProposalSnapshot()));
    mockModule.importProposal.execute.mockResolvedValue(buildProposal());
  });

  it("exports all JSON", async () => {
    mockModule.listProposalDrafts.execute.mockResolvedValue([buildProposal()]);
    render(<ProposalDashboard />);
    await screen.findByText("Propuesta QA");

    fireEvent.click(screen.getByRole("button", { name: "Descargar todo JSON" }));
    await waitFor(() => expect(mockModule.listProposalDrafts.execute).toHaveBeenCalled());
  });

  it("does not delete draft when user cancels confirm", async () => {
    window.confirm = vi.fn().mockReturnValue(false);
    mockModule.listProposalDrafts.execute.mockResolvedValue([buildProposal()]);
    render(<ProposalDashboard />);
    await screen.findByText("Propuesta QA");

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(mockModule.deleteProposalDraft.execute).not.toHaveBeenCalled();
  });

  it("creates first proposal from empty state button", async () => {
    render(<ProposalDashboard />);
    await screen.findByText(/no hay propuestas/i);

    fireEvent.click(screen.getByRole("button", { name: /crear la primera propuesta/i }));
    await waitFor(() => expect(mockModule.createProposalDraft.execute).toHaveBeenCalled());
  });
});
