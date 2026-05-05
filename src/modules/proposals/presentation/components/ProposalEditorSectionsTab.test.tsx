import { fireEvent, render, screen } from "@testing-library/react";
import { ProposalEditorSectionsTab } from "./ProposalEditorSectionsTab";
import { ProposalSection } from "../../domain/entities/Proposal";

vi.mock("./SectionForm", () => ({
  SectionForm: ({ onSubmit, onCancel, isEditing }: { onSubmit: (data: any) => Promise<void>; onCancel?: () => void; isEditing?: boolean }) => (
    <div>
      <p>{isEditing ? "MockSectionFormEdit" : "MockSectionFormCreate"}</p>
      <button type="button" onClick={() => void onSubmit({ title: "S", content: "C", kind: "text" })}>
        MockSubmit
      </button>
      <button type="button" onClick={onCancel}>MockCancel</button>
    </div>
  ),
}));

vi.mock("./SectionsList", () => ({
  SectionsList: ({ onDelete, onMoveUp, onMoveDown, onToggleVisibility, onEdit, sections }: any) => (
    <div>
      <p>MockSectionsList:{sections.length}</p>
      <button type="button" onClick={() => void onDelete("s1")}>Delete</button>
      <button type="button" onClick={() => void onMoveUp("s1")}>Up</button>
      <button type="button" onClick={() => void onMoveDown("s1")}>Down</button>
      <button type="button" onClick={() => void onToggleVisibility("s1")}>Toggle</button>
      <button type="button" onClick={() => onEdit(sections[0])}>Edit</button>
    </div>
  ),
}));

describe("ProposalEditorSectionsTab", () => {
  const sections: ProposalSection[] = [
    { id: "s1", title: "Sec 1", content: "Content", kind: "text", isVisible: true },
  ];

  const buildProps = (overrides: Partial<React.ComponentProps<typeof ProposalEditorSectionsTab>> = {}) => ({
    sections,
    sectionAction: "list" as const,
    editingSection: null,
    showExportImport: false,
    onToggleExportImport: vi.fn(),
    onStartCreate: vi.fn(),
    onCancelCreateOrEdit: vi.fn(),
    onAddSection: vi.fn().mockResolvedValue(undefined),
    onUpdateSection: vi.fn().mockResolvedValue(undefined),
    onDeleteSection: vi.fn().mockResolvedValue(undefined),
    onMoveSection: vi.fn().mockResolvedValue(undefined),
    onToggleSectionVisibility: vi.fn().mockResolvedValue(undefined),
    onEditSection: vi.fn(),
    onExport: vi.fn(),
    onImport: vi.fn(),
    ...overrides,
  });

  it("renders list mode and delegates list actions", () => {
    const props = buildProps();
    render(<ProposalEditorSectionsTab {...props} />);

    expect(screen.getByText("MockSectionsList:1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /mostrar export\/import/i }));
    expect(props.onToggleExportImport).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /nueva seccion/i }));
    expect(props.onStartCreate).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(props.onDeleteSection).toHaveBeenCalledWith("s1");

    fireEvent.click(screen.getByRole("button", { name: "Up" }));
    expect(props.onMoveSection).toHaveBeenCalledWith("s1", "up");

    fireEvent.click(screen.getByRole("button", { name: "Down" }));
    expect(props.onMoveSection).toHaveBeenCalledWith("s1", "down");

    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
    expect(props.onToggleSectionVisibility).toHaveBeenCalledWith("s1");

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(props.onEditSection).toHaveBeenCalledWith(sections[0]);
  });

  it("renders export/import panel and handles actions", () => {
    const props = buildProps({ showExportImport: true });
    render(<ProposalEditorSectionsTab {...props} />);

    expect(screen.getByRole("button", { name: "Descargar JSON" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Descargar JSON" }));
    expect(props.onExport).toHaveBeenCalled();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["{}"], "data.json", { type: "application/json" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(props.onImport).toHaveBeenCalled();
  });

  it("renders create mode with SectionForm", () => {
    const props = buildProps({ sectionAction: "create" });
    render(<ProposalEditorSectionsTab {...props} />);

    expect(screen.getByText("MockSectionFormCreate")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "MockSubmit" }));
    expect(props.onAddSection).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "MockCancel" }));
    expect(props.onCancelCreateOrEdit).toHaveBeenCalled();
  });

  it("renders edit mode with editing data", () => {
    const props = buildProps({
      sectionAction: "edit",
      editingSection: sections[0],
    });
    render(<ProposalEditorSectionsTab {...props} />);

    expect(screen.getByText("MockSectionFormEdit")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "MockSubmit" }));
    expect(props.onUpdateSection).toHaveBeenCalled();
  });
});
