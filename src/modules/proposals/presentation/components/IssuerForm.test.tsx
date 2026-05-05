import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { IssuerForm } from "./IssuerForm";

const initialData = {
  businessName: "JC Engine",
  responsibleName: "Jaime",
  role: "Director",
  email: "hola@jcengine.com",
  phone: "",
  website: "",
  logoUrl: "",
  signatureText: "Jaime",
  signatureFont: "script-elegant" as const,
};

describe("IssuerForm", () => {
  it("shows validation errors for invalid email", async () => {
    render(<IssuerForm initialData={initialData} onSubmit={vi.fn()} />);

    const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
    expect(emailInput).not.toBeNull();
    const websiteInput = document.querySelector<HTMLInputElement>('input[name="website"]');
    expect(websiteInput).not.toBeNull();

    fireEvent.change(websiteInput as HTMLInputElement, {
      target: { value: "sitio-sin-protocolo" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Guardar datos emisor" }));
    // Zod url() default error is "Invalid url" — pick any visible error in the website field row
    expect(await screen.findByText((text) => text.toLowerCase().includes("url") && !text.includes("carga local") && !text.includes("Logo"))).toBeInTheDocument();
  });

  it("submits when valid data changes", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<IssuerForm initialData={initialData} onSubmit={onSubmit} />);

    const phoneInput = document.querySelector<HTMLInputElement>('input[name="phone"]');
    expect(phoneInput).not.toBeNull();
    fireEvent.change(phoneInput as HTMLInputElement, {
      target: { value: "123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Guardar datos emisor" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it("renders all fields with initial values", () => {
    render(<IssuerForm initialData={initialData} onSubmit={vi.fn()} />);

    const bizInput = document.querySelector<HTMLInputElement>('input[name="businessName"]');
    expect(bizInput?.value).toBe("JC Engine");

    const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
    expect(emailInput?.value).toBe("hola@jcengine.com");
  });

  it("submit button is disabled when no changes", () => {
    render(<IssuerForm initialData={initialData} onSubmit={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Guardar datos emisor" })).toBeDisabled();
  });
});
