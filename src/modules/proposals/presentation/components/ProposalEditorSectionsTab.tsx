import { ChangeEvent } from "react";
import { SectionFormDTO } from "../../application/dtos/schemas";
import { ProposalSection } from "../../domain/entities/Proposal";
import { SectionForm } from "./SectionForm";
import { SectionsList } from "./SectionsList";

type SectionAction = "list" | "create" | "edit";

interface ProposalEditorSectionsTabProps {
  sections: ProposalSection[];
  sectionAction: SectionAction;
  editingSection: ProposalSection | null;
  showExportImport: boolean;
  onToggleExportImport: () => void;
  onStartCreate: () => void;
  onCancelCreateOrEdit: () => void;
  onAddSection: (data: SectionFormDTO) => Promise<void>;
  onUpdateSection: (data: SectionFormDTO) => Promise<void>;
  onDeleteSection: (sectionId: string) => Promise<void>;
  onMoveSection: (sectionId: string, direction: "up" | "down") => Promise<void>;
  onToggleSectionVisibility: (sectionId: string) => Promise<void>;
  onEditSection: (section: ProposalSection) => void;
  onExport: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function ProposalEditorSectionsTab({
  sections,
  sectionAction,
  editingSection,
  showExportImport,
  onToggleExportImport,
  onStartCreate,
  onCancelCreateOrEdit,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onMoveSection,
  onToggleSectionVisibility,
  onEditSection,
  onExport,
  onImport,
}: ProposalEditorSectionsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900">Secciones</h2>
        <div className="flex gap-2">
          <button
            onClick={onToggleExportImport}
            className="text-sm px-3 py-1.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            {showExportImport ? "Ocultar" : "Mostrar"} export/import
          </button>
          {sectionAction === "list" && (
            <button
              onClick={onStartCreate}
              className="text-sm px-3 py-1.5 rounded bg-sky-700 text-white hover:bg-sky-800 transition"
            >
              + Nueva seccion
            </button>
          )}
        </div>
      </div>

      {showExportImport && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={onExport}
              className="text-sm px-3 py-1.5 rounded bg-sky-600 text-white hover:bg-sky-700 transition"
            >
              Descargar JSON
            </button>
            <label className="text-sm px-3 py-1.5 rounded bg-sky-600 text-white hover:bg-sky-700 transition cursor-pointer">
              Importar JSON
              <input
                type="file"
                accept=".json"
                onChange={onImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {sectionAction === "create" && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Nueva seccion</h3>
          <SectionForm
            onSubmit={onAddSection}
            onCancel={onCancelCreateOrEdit}
          />
        </div>
      )}

      {sectionAction === "edit" && editingSection && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Editar seccion</h3>
          <SectionForm
            initialData={{
              title: editingSection.title,
              content: editingSection.content,
              kind: editingSection.kind,
            }}
            onSubmit={onUpdateSection}
            onCancel={onCancelCreateOrEdit}
            isEditing={true}
          />
        </div>
      )}

      {sectionAction === "list" && (
        <SectionsList
          sections={sections}
          onDelete={onDeleteSection}
          onMoveUp={(id) => onMoveSection(id, "up")}
          onMoveDown={(id) => onMoveSection(id, "down")}
          onToggleVisibility={onToggleSectionVisibility}
          onEdit={onEditSection}
        />
      )}
    </div>
  );
}
