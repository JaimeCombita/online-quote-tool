"use client";

import { SectionFormDTO } from "../../application/dtos/schemas";
import { SECTION_KINDS, useSectionForm } from "../hooks/forms/useSectionForm";

interface SectionFormProps {
  initialData?: {
    title: string;
    content: string;
    kind: "text" | "bullets" | "highlight" | "table" | "investment";
  };
  onSubmit: (data: SectionFormDTO) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

export function SectionForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false,
}: SectionFormProps) {
  const {
    formData,
    errors,
    isSubmitting,
    bulletItems,
    draggedBulletIndex,
    tableData,
    draggedRowIndex,
    handleChange,
    handleKindChange,
    addBullet,
    updateBullet,
    removeBullet,
    addTableColumn,
    removeTableColumn,
    addTableRow,
    removeTableRow,
    updateTableCell,
    updateTableColumn,
    handleBulletDragStart,
    handleBulletDragOver,
    handleBulletDrop,
    handleRowDragStart,
    handleRowDragOver,
    handleRowDrop,
    handleSubmit,
  } = useSectionForm({
    initialData,
    onSubmit,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Titulo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`mt-1 block w-full rounded border px-3 py-2 text-sm ${
            errors.title ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
          }`}
          disabled={isSubmitting || isLoading}
        />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Tipo de seccion</label>
        <select
          name="kind"
          value={formData.kind}
          onChange={handleKindChange}
          className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
          disabled={isSubmitting || isLoading}
        >
          {SECTION_KINDS.map((kind) => (
            <option key={kind.value} value={kind.value}>
              {kind.label}
            </option>
          ))}
        </select>
      </div>

      {/* Bullets Section */}
      {formData.kind === "bullets" && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Items de la lista</h3>
            <button
              type="button"
              onClick={addBullet}
              className="rounded bg-sky-600 px-2 py-1 text-xs text-white hover:bg-sky-700"
            >
              + Agregar item
            </button>
          </div>

          <div className="space-y-2">
            {bulletItems.map((item, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleBulletDragStart(index)}
                onDragOver={handleBulletDragOver}
                onDrop={() => handleBulletDrop(index)}
                className={`flex gap-2 cursor-move rounded border px-3 py-2 transition ${
                  draggedBulletIndex === index
                    ? "border-sky-500 bg-sky-50 opacity-50"
                    : "border-slate-300 bg-white hover:border-sky-400"
                }`}
              >
                <span className="text-slate-400">≡</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateBullet(index, e.target.value)}
                  placeholder={`Item ${index + 1}`}
                  className="flex-1 border-none bg-transparent text-sm outline-none"
                  disabled={isSubmitting || isLoading}
                />
                {bulletItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBullet(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Section */}
      {formData.kind === "table" && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Tabla</h3>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={addTableColumn}
                className="rounded bg-sky-600 px-2 py-1 text-xs text-white hover:bg-sky-700"
              >
                + Columna
              </button>
              <button
                type="button"
                onClick={addTableRow}
                className="rounded bg-sky-600 px-2 py-1 text-xs text-white hover:bg-sky-700"
              >
                + Fila
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr>
                  {tableData.columns.map((col, colIdx) => (
                    <th key={colIdx} className="border border-slate-300 bg-white p-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={col}
                          onChange={(e) => updateTableColumn(colIdx, e.target.value)}
                          className="flex-1 rounded border border-slate-200 bg-slate-50 px-2 py-1"
                          placeholder={`Col ${colIdx + 1}`}
                          disabled={isSubmitting || isLoading}
                        />
                        {tableData.columns.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTableColumn(colIdx)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  {tableData.rows.length > 1 && <th className="w-8"></th>}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    draggable
                    onDragStart={() => handleRowDragStart(rowIdx)}
                    onDragOver={handleRowDragOver}
                    onDrop={() => handleRowDrop(rowIdx)}
                    className={`cursor-move transition ${
                      draggedRowIndex === rowIdx
                        ? "bg-sky-100 opacity-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {row.map((cell, colIdx) => (
                      <td key={colIdx} className="border border-slate-300 p-1">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => updateTableCell(rowIdx, colIdx, e.target.value)}
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1"
                          disabled={isSubmitting || isLoading}
                        />
                      </td>
                    ))}
                    {tableData.columns.length > 0 && tableData.rows.length > 1 && (
                      <td className="border border-slate-300 p-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeTableRow(rowIdx)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Text/Highlight/Investment - Use textarea */}
      {(formData.kind === "text" || formData.kind === "highlight" || formData.kind === "investment") && (
        <div>
          <label className="block text-sm font-medium text-slate-700">Contenido</label>
          {formData.kind === "text" && (
            <p className="mt-1 text-xs text-slate-500">
              Tip: usa <strong>**Subtitulo**</strong> en una linea para mostrarla como subtitulo en negrilla y azul en la vista previa y PDF.
            </p>
          )}
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={6}
            className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={isSubmitting || isLoading}
            placeholder="Ingresa el contenido de la seccion..."
          />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting || isLoading}
          className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="inline-flex items-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800 disabled:opacity-50"
        >
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear seccion"}
        </button>
      </div>
    </form>
  );
}
