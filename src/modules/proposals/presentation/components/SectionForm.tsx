"use client";

import { SectionFormDTO, SectionFormSchema } from "../../application/dtos/schemas";
import { useState, useCallback } from "react";
import { ZodError } from "zod";

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

const SECTION_KINDS: Array<{ value: "text" | "bullets" | "highlight" | "table" | "investment"; label: string }> = [
  { value: "text", label: "Texto" },
  { value: "bullets", label: "Lista de puntos" },
  { value: "highlight", label: "Destaque" },
  { value: "table", label: "Tabla" },
  { value: "investment", label: "Inversion" },
];

// Parse bullets from string (one per line)
const parseBullets = (content: string): string[] => {
  if (!content) return [""];
  return content.split("\n").map((line) => line.trim());
};

// Serialize bullets to string (join with newlines)
const serializeBullets = (items: string[]): string => {
  return items.filter((item) => item.trim()).join("\n");
};

// Parse table from CSV-like format
interface TableData {
  columns: string[];
  rows: string[][];
}

const parseTable = (content: string): TableData => {
  if (!content.trim()) {
    return { columns: ["Columna 1"], rows: [[""], [""]] };
  }

  const lines = content.split("\n").filter((line) => line.trim());
  if (lines.length === 0) {
    return { columns: ["Columna 1"], rows: [[""], [""]] };
  }

  // First line is columns (pipe-separated)
  const columns = lines[0].split("|").map((col) => col.trim());
  
  // Rest are rows
  const rows = lines.slice(1).map((line) => {
    const cells = line.split("|").map((cell) => cell.trim());
    // Pad with empty cells if needed
    while (cells.length < columns.length) {
      cells.push("");
    }
    return cells.slice(0, columns.length);
  });

  // Ensure at least 2 rows
  if (rows.length === 0) {
    rows.push(new Array(columns.length).fill(""));
    rows.push(new Array(columns.length).fill(""));
  }

  return { columns, rows };
};

// Serialize table to string format
const serializeTable = (data: TableData): string => {
  if (data.columns.length === 0 || data.rows.length === 0) {
    return "";
  }

  const lines: string[] = [];
  lines.push(data.columns.join("|"));
  
  for (const row of data.rows) {
    const filledRow = [...row];
    while (filledRow.length < data.columns.length) {
      filledRow.push("");
    }
    lines.push(filledRow.slice(0, data.columns.length).join("|"));
  }

  return lines.join("\n");
};

export function SectionForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false,
}: SectionFormProps) {
  const [formData, setFormData] = useState<SectionFormDTO>(
    initialData || {
      title: "",
      content: "",
      kind: "text",
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI state for bullets
  const [bulletItems, setBulletItems] = useState<string[]>(
    formData.kind === "bullets" ? parseBullets(formData.content) : [""]
  );
  const [draggedBulletIndex, setDraggedBulletIndex] = useState<number | null>(null);

  // UI state for table
  const [tableData, setTableData] = useState<TableData>(
    formData.kind === "table" ? parseTable(formData.content) : { columns: ["Columna 1"], rows: [[""], [""]] }
  );
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Handle kind change
  const handleKindChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newKind = e.target.value as SectionFormDTO["kind"];
      
      // Reset content when switching types
      let newContent = "";
      if (newKind === "bullets") {
        newContent = "- Punto 1\n- Punto 2";
        setBulletItems(parseBullets(newContent));
      } else if (newKind === "table") {
        newContent = "Encabezado 1|Encabezado 2\nFila 1|Celda";
        setTableData(parseTable(newContent));
      }

      setFormData((prev) => ({
        ...prev,
        kind: newKind,
        content: newContent,
      }));
    },
    []
  );

  // Bullet handlers
  const addBullet = useCallback(() => {
    const newItems = [...bulletItems, ""];
    setBulletItems(newItems);
    setFormData((prev) => ({ ...prev, content: serializeBullets(newItems) }));
  }, [bulletItems]);

  const updateBullet = useCallback(
    (index: number, value: string) => {
      const newItems = [...bulletItems];
      newItems[index] = value;
      setBulletItems(newItems);
      setFormData((prev) => ({ ...prev, content: serializeBullets(newItems) }));
    },
    [bulletItems]
  );

  const removeBullet = useCallback(
    (index: number) => {
      const newItems = bulletItems.filter((_, i) => i !== index);
      setBulletItems(newItems);
      setFormData((prev) => ({ ...prev, content: serializeBullets(newItems) }));
    },
    [bulletItems]
  );

  // Table handlers
  const addTableColumn = useCallback(() => {
    const newData = {
      ...tableData,
      columns: [...tableData.columns, `Columna ${tableData.columns.length + 1}`],
      rows: tableData.rows.map((row) => [...row, ""]),
    };
    setTableData(newData);
    setFormData((prev) => ({ ...prev, content: serializeTable(newData) }));
  }, [tableData]);

  const removeTableColumn = useCallback(
    (colIndex: number) => {
      if (tableData.columns.length <= 1) return;
      const newData = {
        ...tableData,
        columns: tableData.columns.filter((_, i) => i !== colIndex),
        rows: tableData.rows.map((row) => row.filter((_, i) => i !== colIndex)),
      };
      setTableData(newData);
      setFormData((prev) => ({ ...prev, content: serializeTable(newData) }));
    },
    [tableData]
  );

  const addTableRow = useCallback(() => {
    const newData = {
      ...tableData,
      rows: [...tableData.rows, new Array(tableData.columns.length).fill("")],
    };
    setTableData(newData);
    setFormData((prev) => ({ ...prev, content: serializeTable(newData) }));
  }, [tableData]);

  const removeTableRow = useCallback(
    (rowIndex: number) => {
      if (tableData.rows.length <= 1) return;
      const newData = {
        ...tableData,
        rows: tableData.rows.filter((_, i) => i !== rowIndex),
      };
      setTableData(newData);
      setFormData((prev) => ({ ...prev, content: serializeTable(newData) }));
    },
    [tableData]
  );

  const updateTableCell = useCallback(
    (rowIndex: number, colIndex: number, value: string) => {
      const newRows = tableData.rows.map((row, rIdx) => {
        if (rIdx === rowIndex) {
          return row.map((cell, cIdx) => (cIdx === colIndex ? value : cell));
        }
        return row;
      });
      const newData = { ...tableData, rows: newRows };
      setTableData(newData);
      setFormData((prev) => ({ ...prev, content: serializeTable(newData) }));
    },
    [tableData]
  );

  const updateTableColumn = useCallback(
    (colIndex: number, value: string) => {
      const newData = {
        ...tableData,
        columns: tableData.columns.map((col, i) => (i === colIndex ? value : col)),
      };
      setTableData(newData);
      setFormData((prev) => ({ ...prev, content: serializeTable(newData) }));
    },
    [tableData]
  );

  // Drag and drop handlers for bullets
  const handleBulletDragStart = useCallback((index: number) => {
    setDraggedBulletIndex(index);
  }, []);

  const handleBulletDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleBulletDrop = useCallback((targetIndex: number) => {
    if (draggedBulletIndex === null || draggedBulletIndex === targetIndex) return;
    
    const newItems = [...bulletItems];
    const [draggedItem] = newItems.splice(draggedBulletIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);
    
    setBulletItems(newItems);
    setFormData((prev) => ({ ...prev, content: serializeBullets(newItems) }));
    setDraggedBulletIndex(null);
  }, [draggedBulletIndex, bulletItems]);

  // Drag and drop handlers for table rows
  const handleRowDragStart = useCallback((index: number) => {
    setDraggedRowIndex(index);
  }, []);

  const handleRowDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleRowDrop = useCallback((targetIndex: number) => {
    if (draggedRowIndex === null || draggedRowIndex === targetIndex) return;
    
    const newRows = [...tableData.rows];
    const [draggedRow] = newRows.splice(draggedRowIndex, 1);
    newRows.splice(targetIndex, 0, draggedRow);
    
    const newData = { ...tableData, rows: newRows };
    setTableData(newData);
    setFormData((prev) => ({ ...prev, content: serializeTable(newData) }));
    setDraggedRowIndex(null);
  }, [draggedRowIndex, tableData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setErrors({});

      try {
        const validated = SectionFormSchema.parse(formData);
        await onSubmit(validated);
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldErrors: Record<string, string> = {};
          error.issues.forEach((err) => {
            const path = err.path.join(".");
            fieldErrors[path] = err.message;
          });
          setErrors(fieldErrors);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, onSubmit]
  );

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
