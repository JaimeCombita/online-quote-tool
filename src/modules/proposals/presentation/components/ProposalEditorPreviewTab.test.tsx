import { fireEvent, render, screen } from "@testing-library/react";
import { ProposalEditorPreviewTab } from "./ProposalEditorPreviewTab";
import { buildProposal } from "@/test/fixtures/proposalFixture";

vi.mock("./ProposalHtmlPreview", () => ({
  ProposalHtmlPreview: () => <div>MockPreview</div>,
}));

describe("ProposalEditorPreviewTab", () => {
  const previewRef = { current: null as HTMLDivElement | null };

  const buildProps = (overrides: Partial<React.ComponentProps<typeof ProposalEditorPreviewTab>> = {}) => ({
    proposal: buildProposal(),
    pdfValidation: { isValid: true, issues: [] },
    previewPagesContainerRef: previewRef,
    isGeneratingPdf: false,
    isEmailPanelOpen: false,
    isSendingEmail: false,
    recipientEmail: "cliente@empresa.com",
    emailSubject: "Asunto",
    emailMessage: "Mensaje",
    onToggleEmailPanel: vi.fn(),
    onRecipientEmailChange: vi.fn(),
    onEmailSubjectChange: vi.fn(),
    onEmailMessageChange: vi.fn(),
    onGeneratePdf: vi.fn().mockResolvedValue(undefined),
    onSendEmail: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  it("renders preview and calls PDF generation", () => {
    const props = buildProps();
    render(<ProposalEditorPreviewTab {...props} />);

    expect(screen.getByText("MockPreview")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Generar PDF ahora" }));
    expect(props.onGeneratePdf).toHaveBeenCalled();
  });

  it("disables actions when validation is invalid", () => {
    render(
      <ProposalEditorPreviewTab
        {...buildProps({
          pdfValidation: { isValid: false, issues: [{ code: "missing-title", message: "Falta" }] },
          isEmailPanelOpen: true,
        })}
      />,
    );

    expect(screen.getByRole("button", { name: "Generar PDF ahora" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Enviar por email" })).toBeDisabled();
  });

  it("handles email panel interactions", () => {
    const props = buildProps({ isEmailPanelOpen: true });
    render(<ProposalEditorPreviewTab {...props} />);

    fireEvent.click(screen.getByRole("button", { name: /enviar propuesta por email/i }));
    expect(props.onToggleEmailPanel).toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText("cliente@empresa.com"), {
      target: { value: "new@company.com" },
    });
    expect(props.onRecipientEmailChange).toHaveBeenCalledWith("new@company.com");

    fireEvent.change(screen.getByDisplayValue("Asunto"), {
      target: { value: "Nuevo asunto" },
    });
    expect(props.onEmailSubjectChange).toHaveBeenCalledWith("Nuevo asunto");

    fireEvent.change(screen.getByDisplayValue("Mensaje"), {
      target: { value: "Nuevo mensaje" },
    });
    expect(props.onEmailMessageChange).toHaveBeenCalledWith("Nuevo mensaje");

    fireEvent.click(screen.getByRole("button", { name: "Enviar por email" }));
    expect(props.onSendEmail).toHaveBeenCalled();
  });

  it("shows loading labels when sending/generating", () => {
    render(
      <ProposalEditorPreviewTab
        {...buildProps({
          isGeneratingPdf: true,
          isSendingEmail: true,
          isEmailPanelOpen: true,
        })}
      />,
    );

    expect(screen.getByRole("button", { name: "Generando PDF..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Enviando..." })).toBeDisabled();
  });
});
