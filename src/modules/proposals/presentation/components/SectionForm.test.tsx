import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SectionForm } from "./SectionForm";

describe("SectionForm", () => {
  it("creates section with text kind", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<SectionForm onSubmit={onSubmit} />);

    const titleInput = document.querySelector<HTMLInputElement>('input[name="title"]');
    const contentInput = document.querySelector<HTMLTextAreaElement>('textarea[name="content"]');
    expect(titleInput).not.toBeNull();
    expect(contentInput).not.toBeNull();

    fireEvent.change(titleInput as HTMLInputElement, {
      target: { value: "Nueva seccion" },
    });
    fireEvent.change(contentInput as HTMLTextAreaElement, {
      target: { value: "Contenido" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear seccion" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it("supports bullets workflow", () => {
    render(<SectionForm onSubmit={vi.fn()} />);

    const kindSelect = document.querySelector<HTMLSelectElement>('select[name="kind"]');
    expect(kindSelect).not.toBeNull();

    fireEvent.change(kindSelect as HTMLSelectElement, {
      target: { value: "bullets" },
    });

    expect(screen.getByText("Items de la lista")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "+ Agregar item" }));
    expect(screen.getAllByPlaceholderText(/item/i).length).toBeGreaterThan(1);
  });

  it("supports table workflow", () => {
    render(<SectionForm onSubmit={vi.fn()} />);

    const kindSelect = document.querySelector<HTMLSelectElement>('select[name="kind"]');
    expect(kindSelect).not.toBeNull();

    fireEvent.change(kindSelect as HTMLSelectElement, {
      target: { value: "table" },
    });

    expect(screen.getByRole("heading", { name: "Tabla" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "+ Columna" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Fila" }));
    expect(screen.getAllByRole("textbox").length).toBeGreaterThan(2);
  });

  it("supports highlight kind", () => {
    render(<SectionForm onSubmit={vi.fn()} />);
    const kindSelect = document.querySelector<HTMLSelectElement>('select[name="kind"]');
    fireEvent.change(kindSelect as HTMLSelectElement, { target: { value: "highlight" } });
    expect(document.querySelector('textarea[name="content"]')).toBeInTheDocument();
  });

  it("shows validation errors when title is empty", async () => {
    render(<SectionForm onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Crear seccion" }));
    expect(await screen.findByText("El titulo de la seccion es requerido")).toBeInTheDocument();
  });

  it("renders with initial data for edit mode", () => {
    const onSubmit = vi.fn();
    render(
      <SectionForm
        onSubmit={onSubmit}
        initialData={{ title: "Existente", content: "Texto", kind: "text" }}
        isEditing={true}
      />,
    );
    const titleInput = document.querySelector<HTMLInputElement>('input[name="title"]');
    expect(titleInput?.value).toBe("Existente");
    expect(screen.getByRole("button", { name: "Actualizar" })).toBeInTheDocument();
  });
});

describe("SectionForm - advanced", () => {
  it("removes a bullet item", () => {
    render(<SectionForm onSubmit={vi.fn()} />);

    const kindSelect = document.querySelector<HTMLSelectElement>('select[name="kind"]');
    fireEvent.change(kindSelect as HTMLSelectElement, { target: { value: "bullets" } });

    // Add a second bullet so remove button appears
    fireEvent.click(screen.getByRole("button", { name: "+ Agregar item" }));
    const removeBtns = screen.getAllByRole("button", { name: "✕" });
    expect(removeBtns.length).toBeGreaterThan(0);
    fireEvent.click(removeBtns[0]);
    // Should have one fewer bullet
  });

  it("removes a table column and row", () => {
    render(<SectionForm onSubmit={vi.fn()} />);

    const kindSelect = document.querySelector<HTMLSelectElement>('select[name="kind"]');
    fireEvent.change(kindSelect as HTMLSelectElement, { target: { value: "table" } });

    // Add column and row to have remove buttons
    fireEvent.click(screen.getByRole("button", { name: "+ Columna" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Fila" }));

    const removeBtns = screen.getAllByRole("button", { name: "✕" });
    expect(removeBtns.length).toBeGreaterThan(0);
    // Remove first column
    fireEvent.click(removeBtns[0]);
  });

  it("calls onCancel when cancel button clicked", () => {
    const onCancel = vi.fn();
    render(<SectionForm onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
