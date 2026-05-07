import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ProposalDashboard } from "./ProposalDashboard";
import { buildProposal, buildProposalSnapshot } from "@/test/fixtures/proposalFixture";
import { downloadTextFile } from "../../application/services/fileDownload";

vi.mock("../../application/services/fileDownload", () => ({
  downloadTextFile: vi.fn(),
}));

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

    fireEvent.click(screen.getByRole("button", { name: /crear propuesta/i }));

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
    expect(screen.getByRole("heading", { name: /eliminar propuesta/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Si" }));
    await waitFor(() => expect(mockModule.deleteProposalDraft.execute).toHaveBeenCalled());
  });

  it("exports single proposal JSON", async () => {
    mockModule.listProposalDrafts.execute.mockResolvedValueOnce([buildProposal()]);
    render(<ProposalDashboard />);

    await screen.findByText("Propuesta QA");
    fireEvent.click(screen.getByRole("button", { name: "Exportar" }));

    await waitFor(() => {
      expect(mockModule.exportProposal.execute).toHaveBeenCalled();
      expect(downloadTextFile).toHaveBeenCalledWith(
        expect.any(String),
        "Propuesta-cliente-demo.json",
      );
    });
  });

  it("opens and closes company settings modal", async () => {
    render(<ProposalDashboard />);
    await screen.findByText(/no hay propuestas/i);

    fireEvent.click(screen.getByRole("button", { name: /configuracion empresa/i }));
    expect(screen.getByRole("heading", { name: /configuracion general de empresa/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("heading", { name: /configuracion general de empresa/i })).toBeNull();
  });

  it("asks for confirmation before closing company settings with unsaved changes", async () => {
    render(<ProposalDashboard />);
    await screen.findByText(/no hay propuestas/i);

    fireEvent.click(screen.getByRole("button", { name: /configuracion empresa/i }));
    fireEvent.change(document.querySelector<HTMLInputElement>('input[name="phone"]') as HTMLInputElement, {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.getByRole("heading", { name: /descartar cambios/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "No" }));
    expect(screen.getByRole("heading", { name: /configuracion general de empresa/i })).toBeInTheDocument();
  });

  it("exports company settings JSON from the modal", async () => {
    render(<ProposalDashboard />);
    await screen.findByText(/no hay propuestas/i);

    fireEvent.click(screen.getByRole("button", { name: /configuracion empresa/i }));
    fireEvent.click(screen.getByRole("button", { name: /exportar configuracion/i }));

    expect(downloadTextFile).toHaveBeenCalledWith(
      expect.stringContaining('"businessName": "JC Engine"'),
      "configuracion-empresa.json",
    );
  });

  it("imports company settings JSON from the modal", async () => {
    mockModule.listProposalDrafts.execute.mockResolvedValue([buildProposal()]);
    render(<ProposalDashboard />);
    await screen.findByText("Propuesta QA");

    fireEvent.click(screen.getByRole("button", { name: /configuracion empresa/i }));

    const importInput = document.querySelectorAll<HTMLInputElement>('input[type="file"]')[1];
    const file = new File(
      [
        JSON.stringify({
          businessName: "Empresa Importada",
          responsibleName: "Ana",
          role: "Gerencia",
          email: "ana@empresa.com",
          phone: "3000000",
          website: "https://empresa.com",
          logoUrl: "",
          signatureText: "Ana",
          signatureFont: "script-elegant",
        }),
      ],
      "configuracion-empresa.json",
      { type: "application/json" },
    );

    fireEvent.change(importInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockModule.updateProposalDraft.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          issuer: expect.objectContaining({
            businessName: "Empresa Importada",
            responsibleName: "Ana",
          }),
        }),
      );
    });
  });

  it("shows edit link for draft", async () => {
    mockModule.listProposalDrafts.execute.mockResolvedValueOnce([buildProposal()]);
    render(<ProposalDashboard />);

    await screen.findByText("Propuesta QA");
    expect(screen.getByRole("link", { name: /propuesta qa/i })).toHaveAttribute("href", "/editor/proposal-1");
  });

  it("sorts proposals by issue date and vigency", async () => {
    const recent = buildProposal({
      id: "proposal-new",
      metadata: {
        ...buildProposal().snapshot.metadata,
        title: "Nueva",
        issueDate: "2026-01-20T00:00:00.000Z",
      },
    });
    const old = buildProposal({
      id: "proposal-old",
      metadata: {
        ...buildProposal().snapshot.metadata,
        title: "Antigua",
        issueDate: "2026-01-10T00:00:00.000Z",
      },
    });

    mockModule.listProposalDrafts.execute.mockResolvedValueOnce([old, recent]);
    render(<ProposalDashboard />);

    await screen.findByText("Nueva");
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings[0]).toHaveTextContent("Nueva");
    expect(headings[1]).toHaveTextContent("Antigua");
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

    fireEvent.click(screen.getByRole("button", { name: "Descargar" }));
    await waitFor(() => expect(mockModule.listProposalDrafts.execute).toHaveBeenCalled());
  });

  it("does not delete draft when user cancels confirm", async () => {
    mockModule.listProposalDrafts.execute.mockResolvedValue([buildProposal()]);
    render(<ProposalDashboard />);
    await screen.findByText("Propuesta QA");

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    expect(mockModule.deleteProposalDraft.execute).not.toHaveBeenCalled();
  });

  it("hides export when client general info is empty", async () => {
    mockModule.listProposalDrafts.execute.mockResolvedValue([
      buildProposal({
        client: {
          name: "",
          company: "",
          contactName: "",
          phone: "",
          email: "",
        },
      }),
    ]);

    render(<ProposalDashboard />);
    await screen.findByText("Propuesta QA");

    expect(screen.queryByRole("button", { name: "Exportar" })).toBeNull();
  });

  it("creates first proposal from empty state button", async () => {
    render(<ProposalDashboard />);
    await screen.findByText(/no hay propuestas/i);

    fireEvent.click(screen.getByRole("button", { name: /crear la primera propuesta/i }));
    await waitFor(() => expect(mockModule.createProposalDraft.execute).toHaveBeenCalled());
  });
});
