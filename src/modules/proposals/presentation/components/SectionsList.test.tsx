import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SectionsList } from "./SectionsList";

const baseCallbacks = {
  onDelete: vi.fn().mockResolvedValue(undefined),
  onMoveUp: vi.fn().mockResolvedValue(undefined),
  onMoveDown: vi.fn().mockResolvedValue(undefined),
  onToggleVisibility: vi.fn().mockResolvedValue(undefined),
  onEdit: vi.fn(),
};

describe("SectionsList", () => {
  it("renders empty state", () => {
    render(<SectionsList sections={[]} {...baseCallbacks} />);
    expect(screen.getByText(/no hay secciones todavia/i)).toBeInTheDocument();
  });

  it("opens action menu and runs callbacks", async () => {
    render(
      <SectionsList
        sections={[
          { id: "s1", title: "Uno", content: "A", kind: "text", isVisible: true },
          { id: "s2", title: "Dos", content: "B", kind: "bullets", isVisible: true },
        ]}
        {...baseCallbacks}
      />,
    );

    fireEvent.click(screen.getAllByTitle("Acciones")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(baseCallbacks.onEdit).toHaveBeenCalled();

    fireEvent.click(screen.getAllByTitle("Acciones")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Ocultar" }));
    await waitFor(() => expect(baseCallbacks.onToggleVisibility).toHaveBeenCalledWith("s1"));
  });

  it("shows move up/down and delete buttons", async () => {
    render(
      <SectionsList
        sections={[
          { id: "s1", title: "Primero", content: "", kind: "text", isVisible: true },
          { id: "s2", title: "Segundo", content: "", kind: "table", isVisible: false },
        ]}
        {...baseCallbacks}
      />,
    );

    // Open menu for first section (no "Mover arriba" but has "Mover abajo")
    fireEvent.click(screen.getAllByTitle("Acciones")[0]);
    expect(screen.queryByRole("button", { name: "Mover arriba" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Mover abajo" }));
    await waitFor(() => expect(baseCallbacks.onMoveDown).toHaveBeenCalledWith("s1"));

    // Open menu for second section (has "Mover arriba", no "Mover abajo")
    fireEvent.click(screen.getAllByTitle("Acciones")[1]);
    expect(screen.queryByRole("button", { name: "Mover abajo" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Mover arriba" }));
    await waitFor(() => expect(baseCallbacks.onMoveUp).toHaveBeenCalledWith("s2"));
  });

  it("calls onDelete from action menu", async () => {
    render(
      <SectionsList
        sections={[{ id: "s1", title: "Solo", content: "", kind: "text", isVisible: true }]}
        {...baseCallbacks}
      />,
    );

    fireEvent.click(screen.getByTitle("Acciones"));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(baseCallbacks.onDelete).toHaveBeenCalledWith("s1"));
  });

  it("renders kind labels and shows hidden section differently", () => {
    render(
      <SectionsList
        sections={[
          { id: "s1", title: "Tabla sec", content: "", kind: "table", isVisible: true },
          { id: "s2", title: "Oculta", content: "", kind: "highlight", isVisible: false },
        ]}
        {...baseCallbacks}
      />,
    );

    expect(screen.getByText("Tabla")).toBeInTheDocument();
    expect(screen.getByText("Destaque")).toBeInTheDocument();
    // Hidden section shows "Mostrar" instead of "Ocultar" when menu opened
    fireEvent.click(screen.getAllByTitle("Acciones")[1]);
    expect(screen.getByRole("button", { name: "Mostrar" })).toBeInTheDocument();
  });

  it("reorders sections with drag and drop", async () => {
    render(
      <SectionsList
        sections={[
          { id: "s1", title: "Primero", content: "", kind: "text", isVisible: true },
          { id: "s2", title: "Segundo", content: "", kind: "text", isVisible: true },
          { id: "s3", title: "Tercero", content: "", kind: "text", isVisible: true },
        ]}
        {...baseCallbacks}
      />,
    );

    const cards = screen.getAllByText(/ID: s[1-3]/i);
    const sourceCard = cards[0].closest("div[draggable='true']") as HTMLElement;
    const targetCard = cards[2].closest("div[draggable='true']") as HTMLElement;

    fireEvent.dragStart(sourceCard);
    fireEvent.dragOver(targetCard);
    fireEvent.drop(targetCard);

    await waitFor(() => expect(baseCallbacks.onMoveDown).toHaveBeenCalled());
  });

  it("does not open actions when loading", () => {
    render(
      <SectionsList
        sections={[{ id: "s1", title: "Solo", content: "", kind: "text", isVisible: true }]}
        {...baseCallbacks}
        isLoading={true}
      />,
    );

    const menuButton = screen.getByTitle("Acciones");
    expect(menuButton).toBeDisabled();
  });
});
