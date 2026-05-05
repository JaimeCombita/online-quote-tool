import { fireEvent, render, screen } from "@testing-library/react";
import { ProposalEditorClosingTab } from "./ProposalEditorClosingTab";

describe("ProposalEditorClosingTab", () => {
  it("renders defaults and submits form", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ProposalEditorClosingTab
        defaultClosingText="Texto de cierre"
        defaultShowSignature={true}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByDisplayValue("Texto de cierre")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /mostrar firma en el cierre/i })).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "Guardar cierre" }));
    expect(onSubmit).toHaveBeenCalled();
  });
});
