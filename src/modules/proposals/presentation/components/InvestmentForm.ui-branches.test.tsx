import { fireEvent, render, screen } from "@testing-library/react";
import { InvestmentForm } from "./InvestmentForm";

const hookState = {
  formData: {
    enabled: true,
    title: "Inversion test",
    rows: [
      {
        id: "r1",
        concept: "Concepto",
        description: "Desc",
        quantity: 2,
        unitPrice: 1000,
        taxRate: 19,
      },
    ],
    note: "Nota",
    offerValidityDays: 15,
    showTotals: true,
  },
  setFormData: vi.fn(),
  isSubmitting: false,
  error: null as string | null,
  hasChanges: true,
  subtotal: 2000,
  totalTax: 380,
  total: 2380,
  updateRow: vi.fn(),
  addRow: vi.fn(),
  removeRow: vi.fn(),
  handleSubmit: vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault()),
};

const parseFormattedNumberMock = vi.fn((value: string) => Number(value.replace(/\./g, "")));

vi.mock("../hooks/forms/useInvestmentForm", () => ({
  useInvestmentForm: () => hookState,
  formatNumberDisplay: (value: number) => String(value),
  parseFormattedNumber: (value: string) => parseFormattedNumberMock(value),
}));

describe("InvestmentForm UI branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookState.error = null;
    hookState.formData.rows = [
      {
        id: "r1",
        concept: "Concepto",
        description: "Desc",
        quantity: 2,
        unitPrice: 1000,
        taxRate: 19,
      },
    ];
  });

  it("executes field and row handlers", () => {
    render(
      <InvestmentForm
        initialData={{ enabled: false, title: "", rows: [], note: "", offerValidityDays: 30, showTotals: true }}
        currency="COP"
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /incluir bloque de inversion/i }));
    expect(hookState.setFormData).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("checkbox", { name: /incluir seccion de totales/i }));
    expect(hookState.setFormData).toHaveBeenCalledTimes(2);

    fireEvent.change(screen.getByDisplayValue("Inversion test"), { target: { value: "Nuevo titulo" } });
    fireEvent.change(screen.getByDisplayValue("Nota"), { target: { value: "Nueva nota" } });
    fireEvent.change(screen.getByDisplayValue("15"), { target: { value: "20" } });
    expect(hookState.setFormData).toHaveBeenCalledTimes(5);

    fireEvent.click(screen.getByRole("button", { name: "+ Agregar fila" }));
    expect(hookState.addRow).toHaveBeenCalled();

    fireEvent.change(screen.getByDisplayValue("Concepto"), { target: { value: "Nuevo concepto" } });
    expect(hookState.updateRow).toHaveBeenCalledWith("r1", "concept", "Nuevo concepto");

    fireEvent.change(screen.getByDisplayValue("Desc"), { target: { value: "Nueva desc" } });
    expect(hookState.updateRow).toHaveBeenCalledWith("r1", "description", "Nueva desc");

    fireEvent.change(screen.getByDisplayValue("2"), { target: { value: "5" } });
    expect(hookState.updateRow).toHaveBeenCalledWith("r1", "quantity", 5);

    fireEvent.change(screen.getByDisplayValue("1000"), { target: { value: "1200" } });
    expect(hookState.updateRow).toHaveBeenCalledWith("r1", "unitPrice", 1200);

    fireEvent.blur(screen.getByDisplayValue("1000"), { target: { value: "1300" } });
    expect(hookState.updateRow).toHaveBeenCalledWith("r1", "unitPrice", 1300);

    fireEvent.change(screen.getByDisplayValue("19"), { target: { value: "10" } });
    expect(hookState.updateRow).toHaveBeenCalledWith("r1", "taxRate", 10);

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(hookState.removeRow).toHaveBeenCalledWith("r1");

    fireEvent.submit(screen.getByRole("button", { name: "Guardar inversion" }).closest("form") as HTMLFormElement);
    expect(hookState.handleSubmit).toHaveBeenCalled();
  });

  it("shows empty state and error branch", () => {
    hookState.formData.rows = [];
    hookState.error = "Error de inversion";

    render(
      <InvestmentForm
        initialData={{ enabled: false, title: "", rows: [], note: "", offerValidityDays: 30, showTotals: true }}
        currency="USD"
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText(/no hay filas registradas todavia/i)).toBeInTheDocument();
    expect(screen.getByText("Error de inversion")).toBeInTheDocument();
  });

  it("ignores NaN unit price parse branch", () => {
    parseFormattedNumberMock.mockReturnValueOnce(Number.NaN);

    render(
      <InvestmentForm
        initialData={{ enabled: false, title: "", rows: [], note: "", offerValidityDays: 30, showTotals: true }}
        currency="COP"
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByDisplayValue("1000"), { target: { value: "abc" } });

    const unitPriceCalls = hookState.updateRow.mock.calls.filter((call) => call[1] === "unitPrice");
    expect(unitPriceCalls.length).toBe(0);
  });
});
