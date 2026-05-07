import { render, screen } from "@testing-library/react";
import EditorPage from "./page";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    use: vi.fn().mockReturnValue({ id: "abc-123" }),
  };
});

vi.mock("@/modules/proposals/presentation/components/ProposalEditor", () => ({
  ProposalEditor: ({ proposalId }: { proposalId: string }) => <div>Editor:{proposalId}</div>,
}));

describe("Editor page", () => {
  it("resolves params and renders editor", () => {
    render(<EditorPage params={Promise.resolve({ id: "ignored" })} />);

    expect(screen.getByText("Editor:abc-123")).toBeInTheDocument();
  });
});
