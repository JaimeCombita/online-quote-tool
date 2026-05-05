import { render, screen } from "@testing-library/react";
import RootLayout, { metadata } from "./layout";

describe("RootLayout", () => {
  it("renders children", () => {
    render(<RootLayout><div>Child Content</div></RootLayout>);
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("exports metadata", () => {
    expect(metadata.description).toContain("Soluciones digitales escalables");
  });
});
