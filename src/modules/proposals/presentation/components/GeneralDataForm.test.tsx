import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GeneralDataForm } from "./GeneralDataForm";

const initialData = {
  title: "Propuesta inicial",
  subtitle: "",
  clientName: "Cliente",
  clientCompany: "Empresa",
  clientContact: "Ana",
  clientPhone: "300123",
  clientEmail: "cliente@demo.com",
  issueDate: "2026-01-10T00:00:00.000Z",
  city: "Bogota",
  currency: "COP" as const,
};

describe("GeneralDataForm", () => {
  it("shows required indicator for client email", () => {
    render(<GeneralDataForm initialData={initialData} onSubmit={vi.fn()} />);
    const emailLabel = screen.getByText("Email del cliente").closest("label");
    expect(emailLabel).not.toBeNull();
    expect(emailLabel).toHaveTextContent("*");
  });

  it("disables submit when no changes", () => {
    render(<GeneralDataForm initialData={initialData} onSubmit={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
  });

  it("submits valid changes", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<GeneralDataForm initialData={initialData} onSubmit={onSubmit} />);

    const titleInput = document.querySelector<HTMLInputElement>('input[name="title"]');
    expect(titleInput).not.toBeNull();

    fireEvent.change(titleInput as HTMLInputElement, {
      target: { value: "Titulo actualizado" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: "Titulo actualizado" }));
  });

  it("shows validation errors", async () => {
    render(<GeneralDataForm initialData={initialData} onSubmit={vi.fn()} />);

    const clientNameInput = document.querySelector<HTMLInputElement>('input[name="clientName"]');
    expect(clientNameInput).not.toBeNull();

    fireEvent.change(clientNameInput as HTMLInputElement, {
      target: { value: "" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("El nombre del cliente es requerido")).toBeInTheDocument();
  });
});
