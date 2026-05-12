import { fireEvent, render, screen, within } from "@testing-library/react";
import { ProposalDraftCard } from "./ProposalDraftCard";
import { buildProposal } from "@/test/fixtures/proposalFixture";

describe("ProposalDraftCard", () => {
  it("renders metadata and desktop actions", () => {
    const draft = buildProposal();

    render(
      <ProposalDraftCard
        draft={draft}
        onExport={vi.fn()}
        onDelete={vi.fn()}
        onSendWp={vi.fn()}
      />,
    );

    expect(screen.getByText("Propuesta QA")).toBeInTheDocument();
    expect(screen.getByText(/Version v/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Contactar por WhatsApp" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeInTheDocument();
  });

  it("hides whatsapp and export actions when client data is missing", () => {
    const draft = buildProposal({
      client: {
        name: "",
        company: "",
        contactName: "",
        phone: "",
        email: "",
      },
    });

    render(
      <ProposalDraftCard
        draft={draft}
        onExport={vi.fn()}
        onDelete={vi.fn()}
        onSendWp={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Contactar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Exportar" })).toBeNull();
  });

  it("runs mobile menu actions", () => {
    const draft = buildProposal();
    const onExport = vi.fn();
    const onDelete = vi.fn();
    const onSendWp = vi.fn();

    render(
      <ProposalDraftCard
        draft={draft}
        onExport={onExport}
        onDelete={onDelete}
        onSendWp={onSendWp}
      />,
    );

    const mobileMenuRoot = screen.getByRole("button", { name: "Acciones" }).parentElement;
    expect(mobileMenuRoot).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Acciones" }));
    fireEvent.click(within(mobileMenuRoot as HTMLElement).getByRole("button", { name: "Contactar" }));
    expect(onSendWp).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Acciones" }));
    fireEvent.click(within(mobileMenuRoot as HTMLElement).getByRole("button", { name: "Exportar" }));
    expect(onExport).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Acciones" }));
    fireEvent.click(within(mobileMenuRoot as HTMLElement).getByRole("button", { name: "Eliminar" }));
    expect(onDelete).toHaveBeenCalledWith(draft.snapshot.id);
  });

  it("closes mobile menu on outside click and on Escape", () => {
    const draft = buildProposal();

    render(
      <ProposalDraftCard
        draft={draft}
        onExport={vi.fn()}
        onDelete={vi.fn()}
        onSendWp={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Acciones" }));
    expect(screen.getAllByRole("link", { name: "Editar" })).toHaveLength(2);

    fireEvent.mouseDown(document.body);
    expect(screen.getAllByRole("link", { name: "Editar" })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Acciones" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getAllByRole("link", { name: "Editar" })).toHaveLength(1);
  });
});
