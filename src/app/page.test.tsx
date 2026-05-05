import { render, screen } from "@testing-library/react";
import Home from "./page";

vi.mock("@/modules/proposals/presentation/components/ProposalDashboard", () => ({
  ProposalDashboard: () => <div>MockDashboard</div>,
}));

describe("Home page", () => {
  it("renders dashboard in brand frame", () => {
    render(<Home />);
    expect(screen.getByText("Generador de propuestas comerciales")).toBeInTheDocument();
    expect(screen.getByText("MockDashboard")).toBeInTheDocument();
  });
});
