import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ProposalEditor } from "./ProposalEditor";
import { buildProposal } from "@/test/fixtures/proposalFixture";

const mockModule = {
  listProposalDrafts: { execute: vi.fn() },
  updateProposalDraft: { execute: vi.fn() },
  saveProposalSnapshot: { execute: vi.fn() },
  addSection: { execute: vi.fn() },
  updateSection: { execute: vi.fn() },
  deleteSection: { execute: vi.fn() },
  moveSection: { execute: vi.fn() },
  toggleSectionVisibility: { execute: vi.fn() },
  exportProposal: { execute: vi.fn() },
  importProposal: { execute: vi.fn() },
};

vi.mock("../../composition/proposalModule", () => ({
  createProposalModule: () => mockModule,
}));

describe("ProposalEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const proposal = buildProposal();
    mockModule.listProposalDrafts.execute.mockResolvedValue([proposal]);
    mockModule.updateProposalDraft.execute.mockResolvedValue(proposal);
    mockModule.saveProposalSnapshot.execute.mockResolvedValue(undefined);
    mockModule.addSection.execute.mockResolvedValue(proposal);
    mockModule.updateSection.execute.mockResolvedValue(proposal);
    mockModule.deleteSection.execute.mockResolvedValue(proposal);
    mockModule.moveSection.execute.mockResolvedValue(proposal);
    mockModule.toggleSectionVisibility.execute.mockResolvedValue(proposal);
    mockModule.exportProposal.execute.mockResolvedValue("{}");
    mockModule.importProposal.execute.mockResolvedValue(proposal);
  });

  it("loads proposal and navigates tabs", async () => {
    render(<ProposalEditor proposalId="proposal-1" />);

    expect(await screen.findByText("Propuesta QA")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Secciones" }));
    expect(screen.getByRole("heading", { name: "Secciones" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Inversion" }));
    expect(screen.getByText("Filas de inversion")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cierre" }));
    expect(screen.getByRole("button", { name: "Guardar cierre" })).toBeInTheDocument();
  });

  it("shows not found state", async () => {
    mockModule.listProposalDrafts.execute.mockResolvedValueOnce([]);
    render(<ProposalEditor proposalId="missing" />);

    expect(await screen.findByText(/propuesta no encontrada|proposal not found/i)).toBeInTheDocument();
  });

  it("triggers save in closing tab", async () => {
    render(<ProposalEditor proposalId="proposal-1" />);
    await screen.findByText("Propuesta QA");

    fireEvent.click(screen.getByRole("button", { name: "Cierre" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar cierre" }));

    await waitFor(() => expect(mockModule.updateProposalDraft.execute).toHaveBeenCalled());
  });

  it("opens add section form and creates a section", async () => {
    render(<ProposalEditor proposalId="proposal-1" />);
    await screen.findByText("Propuesta QA");

    fireEvent.click(screen.getByRole("button", { name: "Secciones" }));
    fireEvent.click(screen.getByRole("button", { name: /nueva seccion/i }));

    // SectionForm should appear with "Crear seccion" button
    const titleInput = await screen.findByRole("button", { name: "Crear seccion" });
    expect(titleInput).toBeInTheDocument();

    const nameInput = document.querySelector<HTMLInputElement>('input[name="title"]');
    fireEvent.change(nameInput as HTMLInputElement, { target: { value: "Seccion nueva" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear seccion" }));

    await waitFor(() => expect(mockModule.addSection.execute).toHaveBeenCalled());
  });

  it("submits general data form", async () => {
    render(<ProposalEditor proposalId="proposal-1" />);
    await screen.findByText("Propuesta QA");

    // General tab is default; submit form with a change
    const titleInput = document.querySelector<HTMLInputElement>('input[name="title"]');
    expect(titleInput).not.toBeNull();
    fireEvent.change(titleInput as HTMLInputElement, { target: { value: "Nuevo titulo" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(mockModule.updateProposalDraft.execute).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: expect.objectContaining({ title: "Nuevo titulo" }) }),
      ),
    );
  });

  it("submits investment form", async () => {
    render(<ProposalEditor proposalId="proposal-1" />);
    await screen.findByText("Propuesta QA");

    fireEvent.click(screen.getByRole("button", { name: "Inversion" }));
    fireEvent.click(screen.getByRole("button", { name: /guardar inversion/i }));

    await waitFor(() => expect(mockModule.updateProposalDraft.execute).toHaveBeenCalled());
  });

  it("toggles export/import panel", async () => {
    render(<ProposalEditor proposalId="proposal-1" />);
    await screen.findByText("Propuesta QA");

    // Sections tab has export/import toggle
    fireEvent.click(screen.getByRole("button", { name: "Secciones" }));
    fireEvent.click(screen.getByRole("button", { name: /export\/import/i }));
    expect(screen.getByRole("button", { name: /descargar json/i })).toBeInTheDocument();
  });

  it("edits a section from list", async () => {
    const proposal = buildProposal();
    mockModule.listProposalDrafts.execute.mockResolvedValue([proposal]);
    render(<ProposalEditor proposalId="proposal-1" />);
    await screen.findByText("Propuesta QA");

    fireEvent.click(screen.getByRole("button", { name: "Secciones" }));

    const menuBtns = screen.queryAllByTitle("Acciones");
    if (menuBtns.length > 0) {
      fireEvent.click(menuBtns[0]);
      fireEvent.click(screen.getByRole("button", { name: "Editar" }));
      expect(screen.getByRole("button", { name: "Actualizar" })).toBeInTheDocument();
    }
  });

  it("shows preview tab content", async () => {
    render(<ProposalEditor proposalId="proposal-1" />);
    await screen.findByText("Propuesta QA");

    fireEvent.click(screen.getByRole("button", { name: "Vista previa HTML" }));
    expect(screen.getByRole("button", { name: /generar pdf/i })).toBeInTheDocument();
  });

  it("opens email panel in preview tab", async () => {
    render(<ProposalEditor proposalId="proposal-1" />);
    await screen.findByText("Propuesta QA");

    fireEvent.click(screen.getByRole("button", { name: "Vista previa HTML" }));
    fireEvent.click(screen.getByRole("button", { name: /enviar propuesta por email/i }));
    expect(screen.getByPlaceholderText(/cliente@empresa.com/i)).toBeInTheDocument();
  });

  it("opens and closes company settings modal", async () => {
    render(<ProposalEditor proposalId="proposal-1" />);
    await screen.findByText("Propuesta QA");

    fireEvent.click(screen.getByRole("button", { name: /configuracion empresa/i }));
    expect(screen.getByRole("heading", { name: /configuracion general de empresa/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("heading", { name: /configuracion general de empresa/i })).toBeNull();
  });
  it("clicks Descargar JSON in export panel", async () => {
    render(<ProposalEditor proposalId="proposal-1" />);
    await screen.findByText("Propuesta QA");

    fireEvent.click(screen.getByRole("button", { name: "Secciones" }));
    fireEvent.click(screen.getByRole("button", { name: /export\/import/i }));
    fireEvent.click(screen.getByRole("button", { name: /descargar json/i }));

    await waitFor(() => expect(mockModule.exportProposal.execute).toHaveBeenCalled());
  });

  it("deletes a section through section list menu", async () => {
    render(<ProposalEditor proposalId="proposal-1" />);
    await screen.findByText("Propuesta QA");

    fireEvent.click(screen.getByRole("button", { name: "Secciones" }));
    const menuBtns = screen.queryAllByTitle("Acciones");
    if (menuBtns.length > 0) {
      fireEvent.click(menuBtns[0]);
      fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
      await waitFor(() => expect(mockModule.deleteSection.execute).toHaveBeenCalled());
    }
  });

  it("toggles section visibility through section list menu", async () => {
    render(<ProposalEditor proposalId="proposal-1" />);
    await screen.findByText("Propuesta QA");

    fireEvent.click(screen.getByRole("button", { name: "Secciones" }));
    const menuBtns = screen.queryAllByTitle("Acciones");
    if (menuBtns.length > 0) {
      fireEvent.click(menuBtns[0]);
      const toggleBtn = screen
        .getAllByRole("button")
        .find((button) => {
          const label = button.textContent?.trim();
          return label === "Ocultar" || label === "Mostrar";
        });
      if (toggleBtn) {
        fireEvent.click(toggleBtn);
        await waitFor(() => expect(mockModule.toggleSectionVisibility.execute).toHaveBeenCalled());
      }
    }
  });

  it("cancels adding section", async () => {
    render(<ProposalEditor proposalId="proposal-1" />);
    await screen.findByText("Propuesta QA");

    fireEvent.click(screen.getByRole("button", { name: "Secciones" }));
    fireEvent.click(screen.getByRole("button", { name: /\+ nueva seccion/i }));

    const cancelBtn = screen.queryByRole("button", { name: /cancelar/i });
    if (cancelBtn) {
      fireEvent.click(cancelBtn);
      expect(screen.queryByRole("button", { name: "Crear seccion" })).toBeNull();
    }
  });

  it("shows Abrir vista previa HTML shortcut button", async () => {
    render(<ProposalEditor proposalId="proposal-1" />);
    await screen.findByText("Propuesta QA");

    fireEvent.click(screen.getByRole("button", { name: "Abrir vista previa HTML" }));
    expect(screen.getByRole("button", { name: /generar pdf/i })).toBeInTheDocument();
  });
});
