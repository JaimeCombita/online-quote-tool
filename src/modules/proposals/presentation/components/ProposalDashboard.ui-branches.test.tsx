import { fireEvent, render, screen } from "@testing-library/react";
import { buildProposal } from "@/test/fixtures/proposalFixture";
import { ProposalDashboard } from "./ProposalDashboard";

const controller = {
  drafts: [] as ReturnType<typeof buildProposal>[],
  isLoading: false,
  error: null as string | null,
  creatingNew: false,
  isCompanySettingsOpen: false,
  setIsCompanySettingsOpen: vi.fn(),
  blockingMessage: null as string | null,
  companySettings: {
    businessName: "JC Engine",
    responsibleName: "Juan",
    role: "Gerencia",
    email: "empresa@demo.com",
    phone: "",
    website: "",
    logoUrl: "",
    signatureText: "Juan",
    signatureFont: "script-elegant",
  },
  companySettingsImportInputRef: { current: null as null | { click: () => void } },
  importJsonInputRef: { current: null as null | { click: () => void } },
  handleCreateNew: vi.fn(),
  handleCompanySettingsSubmit: vi.fn().mockResolvedValue(undefined),
  handleExportCompanySettings: vi.fn(),
  handleImportCompanySettings: vi.fn(),
  handleDelete: vi.fn().mockResolvedValue(undefined),
  handleExportAllJson: vi.fn(),
  handleExportSingleJson: vi.fn(),
  handleImportJson: vi.fn(),
  handleSendWhatsApp: vi.fn(),
};

vi.mock("../hooks/useProposalDashboardController", () => ({
  useProposalDashboardController: () => controller,
}));

vi.mock("./ProposalDraftCard", () => ({
  ProposalDraftCard: ({ draft, onDelete }: { draft: ReturnType<typeof buildProposal>; onDelete: (id: string) => void }) => (
    <button type="button" onClick={() => onDelete(draft.snapshot.id)}>
      trigger-delete
    </button>
  ),
}));

vi.mock("./IssuerForm", () => ({
  IssuerForm: ({ onDirtyChange }: { onDirtyChange: (isDirty: boolean) => void }) => (
    <button type="button" onClick={() => onDirtyChange(true)}>
      mark-dirty
    </button>
  ),
}));

vi.mock("../../../shared/presentation/components/ConfirmationDialog", () => ({
  ConfirmationDialog: ({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) => (
    <div>
      <button type="button" onClick={onConfirm}>
        {title}-confirm
      </button>
      <button type="button" onClick={onCancel}>
        {title}-cancel
      </button>
    </div>
  ),
}));

describe("ProposalDashboard ui branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    controller.drafts = [];
    controller.isLoading = false;
    controller.error = null;
    controller.creatingNew = false;
    controller.isCompanySettingsOpen = false;
    controller.blockingMessage = null;
    controller.importJsonInputRef.current = null;
    controller.companySettingsImportInputRef.current = null;
  });

  it("covers import button optional click branches", () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => undefined);

    render(<ProposalDashboard />);
    fireEvent.click(screen.getByRole("button", { name: "Importar" }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  it("covers company settings import and close branches", () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => undefined);
    controller.isCompanySettingsOpen = true;

    render(<ProposalDashboard />);

    fireEvent.click(screen.getByRole("button", { name: "Importar configuracion" }));
    expect(clickSpy).toHaveBeenCalledTimes(1);

    const fileInputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    const file = new File(["{}"], "configuracion.json", { type: "application/json" });
    fireEvent.change(fileInputs[1], { target: { files: [file] } });
    expect(controller.handleImportCompanySettings).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(controller.setIsCompanySettingsOpen).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByRole("button", { name: "mark-dirty" }));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    fireEvent.click(screen.getByRole("button", { name: "Descartar cambios-confirm" }));
    expect(controller.setIsCompanySettingsOpen).toHaveBeenCalledWith(false);
    clickSpy.mockRestore();
  });

  it("covers delete confirm guard and success branches", async () => {
    controller.drafts = [buildProposal()];

    render(<ProposalDashboard />);

    fireEvent.click(screen.getByRole("button", { name: "Eliminar propuesta-confirm" }));
    expect(controller.handleDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "trigger-delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar propuesta-confirm" }));

    await Promise.resolve();
    expect(controller.handleDelete).toHaveBeenCalledTimes(1);
  });
});
