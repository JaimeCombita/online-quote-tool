import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InvestmentForm } from "./InvestmentForm";

const initialData = {
  enabled: false,
  title: "Inversion",
  rows: [],
  note: "",
  offerValidityDays: 30,
  showTotals: true,
};

describe("InvestmentForm", () => {
  it("adds rows and validates missing concept when enabled", async () => {
    render(<InvestmentForm initialData={initialData} currency="COP" onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByRole("checkbox", { name: /incluir bloque de inversion/i }));
    fireEvent.click(screen.getByRole("button", { name: "+ Agregar fila" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar inversion" }));

    expect(await screen.findByText("Cada fila de inversion debe tener un concepto.")).toBeInTheDocument();
  });

  it("submits with valid concept", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<InvestmentForm initialData={initialData} currency="COP" onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("checkbox", { name: /incluir bloque de inversion/i }));
    fireEvent.click(screen.getByRole("button", { name: "+ Agregar fila" }));

    const conceptLabel = screen.getByText("Concepto");
    const conceptInput = conceptLabel.parentElement?.querySelector("input");
    expect(conceptInput).not.toBeNull();
    fireEvent.change(conceptInput as HTMLInputElement, {
      target: { value: "Servicio" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Guardar inversion" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it("removes a row", async () => {
    render(<InvestmentForm initialData={initialData} currency="COP" onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByRole("checkbox", { name: /incluir bloque de inversion/i }));
    fireEvent.click(screen.getByRole("button", { name: "+ Agregar fila" }));
    expect(screen.getByText("Concepto")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(screen.queryByText("Concepto")).toBeNull();
  });

  it("renders with pre-existing enabled investment", () => {
    render(
      <InvestmentForm
        initialData={{
          enabled: true,
          title: "Paquete Pro",
          rows: [{ id: "r1", concept: "Dev", description: "", quantity: 1, unitPrice: 1000, taxRate: 0 }],
          note: "Condiciones especiales",
          offerValidityDays: 15,
          showTotals: false,
        }}
        currency="USD"
        onSubmit={vi.fn()}
      />,
    );

    // Title is rendered in an input; use value check
    const titleInput = screen.getByDisplayValue("Paquete Pro");
    expect(titleInput).toBeInTheDocument();
    expect(screen.getByDisplayValue("15")).toBeInTheDocument();
  });
});
