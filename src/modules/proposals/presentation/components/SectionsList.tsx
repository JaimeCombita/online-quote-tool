"use client";

import { ProposalSection } from "../../domain/entities/Proposal";
import { useState } from "react";

interface SectionsListProps {
  sections: ProposalSection[];
  onDelete: (sectionId: string) => Promise<void>;
  onMoveUp: (sectionId: string) => Promise<void>;
  onMoveDown: (sectionId: string) => Promise<void>;
  onToggleVisibility: (sectionId: string) => Promise<void>;
  onEdit: (section: ProposalSection) => void;
  isLoading?: boolean;
}

const getSectionKindLabel = (kind: string): string => {
  const labels: Record<string, string> = {
    text: "Texto",
    bullets: "Lista de puntos",
    highlight: "Destaque",
    table: "Tabla",
    investment: "Inversion",
  };
  return labels[kind] || kind;
};

export function SectionsList({
  sections,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  onEdit,
  isLoading = false,
}: SectionsListProps) {
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const [openMenuSectionId, setOpenMenuSectionId] = useState<string | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);

  const handleAction = async (actionKey: string, action: () => Promise<void>) => {
    setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));
    try {
      await action();
    } finally {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleDropSection = async (targetSectionId: string) => {
    if (!draggedSectionId || draggedSectionId === targetSectionId || isLoading) {
      setDragOverSectionId(null);
      return;
    }

    const sourceIndex = sections.findIndex((section) => section.id === draggedSectionId);
    const targetIndex = sections.findIndex((section) => section.id === targetSectionId);

    if (sourceIndex < 0 || targetIndex < 0) {
      setDragOverSectionId(null);
      return;
    }

    if (sourceIndex < targetIndex) {
      for (let index = sourceIndex; index < targetIndex; index += 1) {
        // Keep moving the same section down until it reaches target position.
        await handleAction(`drag-down-${draggedSectionId}-${index}`, () => onMoveDown(draggedSectionId));
      }
    } else {
      for (let index = sourceIndex; index > targetIndex; index -= 1) {
        // Keep moving the same section up until it reaches target position.
        await handleAction(`drag-up-${draggedSectionId}-${index}`, () => onMoveUp(draggedSectionId));
      }
    }

    setDragOverSectionId(null);
  };

  if (sections.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">No hay secciones todavia. Crea una nueva para empezar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Arrastra las tarjetas para reordenar las secciones, o usa el menu ⋮ para mas opciones.
      </p>
      {sections.map((section, index) => (
        <div
          key={section.id}
          draggable={!isLoading}
          onDragStart={() => {
            setDraggedSectionId(section.id);
            setOpenMenuSectionId(null);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOverSectionId(section.id);
          }}
          onDrop={() => {
            void handleDropSection(section.id);
          }}
          onDragEnd={() => {
            setDraggedSectionId(null);
            setDragOverSectionId(null);
          }}
          className={`rounded-lg border ${
            section.isVisible ? "border-slate-300 bg-white" : "border-slate-200 bg-slate-50"
          } p-4 transition ${dragOverSectionId === section.id ? "ring-2 ring-sky-300" : ""}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="cursor-grab select-none text-slate-400" title="Arrastra para reordenar">
                  ≡
                </span>
                <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
                <span className="inline-block rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {getSectionKindLabel(section.kind)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">ID: {section.id}</p>
              {section.content && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{section.content}</p>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setOpenMenuSectionId((current) => (current === section.id ? null : section.id));
                }}
                disabled={isLoading}
                className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                title="Acciones"
              >
                ⋮
              </button>

              {openMenuSectionId === section.id && (
                <div className="absolute right-0 z-10 mt-1 min-w-40 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuSectionId(null);
                      void handleAction(`toggle-${section.id}`, () => onToggleVisibility(section.id));
                    }}
                    disabled={isLoading || loadingActions[`toggle-${section.id}`]}
                    className="block w-full rounded px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    {section.isVisible ? "Ocultar" : "Mostrar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuSectionId(null);
                      onEdit(section);
                    }}
                    disabled={isLoading}
                    className="block w-full rounded px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    Editar
                  </button>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenuSectionId(null);
                        void handleAction(`moveup-${section.id}`, () => onMoveUp(section.id));
                      }}
                      disabled={isLoading || loadingActions[`moveup-${section.id}`]}
                      className="block w-full rounded px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      Mover arriba
                    </button>
                  )}
                  {index < sections.length - 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenuSectionId(null);
                        void handleAction(`movedown-${section.id}`, () => onMoveDown(section.id));
                      }}
                      disabled={isLoading || loadingActions[`movedown-${section.id}`]}
                      className="block w-full rounded px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      Mover abajo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuSectionId(null);
                      void handleAction(`delete-${section.id}`, () => onDelete(section.id));
                    }}
                    disabled={isLoading || loadingActions[`delete-${section.id}`]}
                    className="block w-full rounded px-3 py-2 text-left text-xs text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
