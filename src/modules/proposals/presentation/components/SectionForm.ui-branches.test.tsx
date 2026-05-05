import { fireEvent, render, screen } from "@testing-library/react";
import { SectionForm } from "./SectionForm";

const hookState = {
  formData: { title: "Titulo", content: "Contenido", kind: "text" as const },
  errors: {} as Record<string, string>,
  isSubmitting: false,
  bulletItems: ["Item 1", "Item 2"],
  draggedBulletIndex: null as number | null,
  tableData: {
    columns: ["Col 1", "Col 2"],
    rows: [["A1", "A2"], ["B1", "B2"]],
  },
  draggedRowIndex: null as number | null,
  handleChange: vi.fn(),
  handleKindChange: vi.fn(),
  addBullet: vi.fn(),
  updateBullet: vi.fn(),
  removeBullet: vi.fn(),
  addTableColumn: vi.fn(),
  removeTableColumn: vi.fn(),
  addTableRow: vi.fn(),
  removeTableRow: vi.fn(),
  updateTableCell: vi.fn(),
  updateTableColumn: vi.fn(),
  handleBulletDragStart: vi.fn(),
  handleBulletDragOver: vi.fn(),
  handleBulletDrop: vi.fn(),
  handleRowDragStart: vi.fn(),
  handleRowDragOver: vi.fn(),
  handleRowDrop: vi.fn(),
  handleSubmit: vi.fn((event: React.FormEvent) => event.preventDefault()),
};

vi.mock("../hooks/forms/useSectionForm", () => ({
  SECTION_KINDS: [
    { value: "text", label: "Texto" },
    { value: "bullets", label: "Lista de puntos" },
    { value: "highlight", label: "Destaque" },
    { value: "table", label: "Tabla" },
    { value: "investment", label: "Inversion" },
  ],
  useSectionForm: () => hookState,
}));

describe("SectionForm UI branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookState.formData = { title: "Titulo", content: "Contenido", kind: "text" };
    hookState.errors = {};
    hookState.draggedBulletIndex = null;
    hookState.draggedRowIndex = null;
  });

  it("renders text mode and submit/cancel handlers", () => {
    const onCancel = vi.fn();

    render(<SectionForm onSubmit={vi.fn()} onCancel={onCancel} />);

    fireEvent.change(screen.getByDisplayValue("Titulo"), { target: { value: "Nuevo" } });
    expect(hookState.handleChange).toHaveBeenCalled();

    fireEvent.change(screen.getByDisplayValue("Texto"), { target: { value: "highlight" } });
    expect(hookState.handleKindChange).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalled();

    fireEvent.submit(screen.getByRole("button", { name: "Crear seccion" }).closest("form") as HTMLFormElement);
    expect(hookState.handleSubmit).toHaveBeenCalled();
  });

  it("covers bullets mode interactions and drag handlers", () => {
    hookState.formData = { title: "Bullets", content: "", kind: "bullets" };
    hookState.draggedBulletIndex = 0;

    render(<SectionForm onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "+ Agregar item" }));
    expect(hookState.addBullet).toHaveBeenCalled();

    fireEvent.change(screen.getByDisplayValue("Item 1"), { target: { value: "Actualizado" } });
    expect(hookState.updateBullet).toHaveBeenCalledWith(0, "Actualizado");

    const firstBulletCard = screen.getByDisplayValue("Item 1").closest("div[draggable='true']") as HTMLElement;
    fireEvent.dragStart(firstBulletCard);
    expect(hookState.handleBulletDragStart).toHaveBeenCalledWith(0);

    fireEvent.dragOver(firstBulletCard);
    expect(hookState.handleBulletDragOver).toHaveBeenCalled();

    fireEvent.drop(firstBulletCard);
    expect(hookState.handleBulletDrop).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getAllByRole("button", { name: "✕" })[0]);
    expect(hookState.removeBullet).toHaveBeenCalledWith(0);
  });

  it("covers table mode interactions and drag handlers", () => {
    hookState.formData = { title: "Tabla", content: "", kind: "table" };
    hookState.draggedRowIndex = 0;

    render(<SectionForm onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "+ Columna" }));
    expect(hookState.addTableColumn).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "+ Fila" }));
    expect(hookState.addTableRow).toHaveBeenCalled();

    fireEvent.change(screen.getByDisplayValue("Col 1"), { target: { value: "Nueva Col" } });
    expect(hookState.updateTableColumn).toHaveBeenCalledWith(0, "Nueva Col");

    fireEvent.change(screen.getByDisplayValue("A1"), { target: { value: "Cell" } });
    expect(hookState.updateTableCell).toHaveBeenCalledWith(0, 0, "Cell");

    const firstRow = screen.getByDisplayValue("A1").closest("tr") as HTMLElement;
    fireEvent.dragStart(firstRow);
    expect(hookState.handleRowDragStart).toHaveBeenCalledWith(0);

    fireEvent.dragOver(firstRow);
    expect(hookState.handleRowDragOver).toHaveBeenCalled();

    fireEvent.drop(firstRow);
    expect(hookState.handleRowDrop).toHaveBeenCalledWith(0);

    const removeButtons = screen.getAllByRole("button", { name: "✕" });
    fireEvent.click(removeButtons[0]);
    expect(hookState.removeTableColumn).toHaveBeenCalledWith(0);

    fireEvent.click(removeButtons[removeButtons.length - 1]);
    expect(hookState.removeTableRow).toHaveBeenCalledWith(1);
  });

  it("shows error and loading/edit labels", () => {
    hookState.errors = { title: "Error titulo" };
    hookState.isSubmitting = true;

    const { rerender } = render(<SectionForm onSubmit={vi.fn()} isEditing={true} />);

    expect(screen.getByText("Error titulo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();

    hookState.isSubmitting = false;
    rerender(<SectionForm onSubmit={vi.fn()} isEditing={true} />);

    expect(screen.getByRole("button", { name: "Actualizar" })).toBeInTheDocument();
  });
});
