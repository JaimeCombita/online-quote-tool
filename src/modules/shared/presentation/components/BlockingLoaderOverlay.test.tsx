import { render, screen } from "@testing-library/react";
import { BlockingLoaderOverlay } from "./BlockingLoaderOverlay";

describe("BlockingLoaderOverlay", () => {
  it("does not render when closed", () => {
    const { container } = render(<BlockingLoaderOverlay isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders default message when open", () => {
    render(<BlockingLoaderOverlay isOpen={true} />);
    expect(screen.getByText("Procesando...")).toBeInTheDocument();
  });

  it("renders custom message", () => {
    render(<BlockingLoaderOverlay isOpen={true} message="Enviando correo..." />);
    expect(screen.getByText("Enviando correo...")).toBeInTheDocument();
  });
});
