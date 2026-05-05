import { render, screen } from "@testing-library/react";
import { BackToDashboardLink, JcEngineBrandFrame } from "./JcEngineBrandFrame";
import { jcBrandConfig } from "../../branding/brand.config";

describe("JcEngineBrandFrame", () => {
  it("renders title, subtitle, children and nav links", () => {
    render(
      <JcEngineBrandFrame pageTitle="Titulo" pageSubtitle="Subtitulo">
        <div>Contenido interno</div>
      </JcEngineBrandFrame>,
    );

    expect(screen.getByText("Titulo")).toBeInTheDocument();
    expect(screen.getByText("Subtitulo")).toBeInTheDocument();
    expect(screen.getByText("Contenido interno")).toBeInTheDocument();

    for (const item of jcBrandConfig.links.nav) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }
  });

  it("renders top right content when provided", () => {
    render(
      <JcEngineBrandFrame pageTitle="Titulo" pageSubtitle="Subtitulo" topRightContent={<button>Accion</button>}>
        <div>Body</div>
      </JcEngineBrandFrame>,
    );

    expect(screen.getByRole("button", { name: "Accion" })).toBeInTheDocument();
  });
});

describe("BackToDashboardLink", () => {
  it("links back to root", () => {
    render(<BackToDashboardLink />);
    expect(screen.getByRole("link", { name: /volver al dashboard/i })).toHaveAttribute("href", "/");
  });
});
