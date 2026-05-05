import { useCallback, useState } from "react";
import { SectionFormDTO, SectionFormSchema } from "../../../application/dtos/schemas";
import { ZodError } from "zod";

export const SECTION_KINDS: Array<{
  value: "text" | "bullets" | "highlight" | "table" | "investment";
  label: string;
}> = [
  { value: "text", label: "Texto" },
  { value: "bullets", label: "Lista de puntos" },
  { value: "highlight", label: "Destaque" },
  { value: "table", label: "Tabla" },
  { value: "investment", label: "Inversion" },
];

interface TableData {
  columns: string[];
  rows: string[][];
}

const parseBullets = (content: string): string[] => {
  if (!content) {
    return [""];
  }
  return content.split("\n").map((line) => line.trim());
};

const serializeBullets = (items: string[]): string => {
  return items.filter((item) => item.trim()).join("\n");
};

const parseTable = (content: string): TableData => {
  if (!content.trim()) {
    return { columns: ["Columna 1"], rows: [[""], [""]] };
  }

  const lines = content.split("\n").filter((line) => line.trim());
  if (lines.length === 0) {
    return { columns: ["Columna 1"], rows: [[""], [""]] };
  }

  const columns = lines[0].split("|").map((col) => col.trim());

  const rows = lines.slice(1).map((line) => {
    const cells = line.split("|").map((cell) => cell.trim());
    while (cells.length < columns.length) {
      cells.push("");
    }
    return cells.slice(0, columns.length);
  });

  if (rows.length === 0) {
    rows.push(new Array(columns.length).fill(""));
    rows.push(new Array(columns.length).fill(""));
  }

  return { columns, rows };
};

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

interface UseSectionFormParams {
  initialData?: {
    title: string;
    content: string;
    kind: "text" | "bullets" | "highlight" | "table" | "investment";
  };
  onSubmit: (data: SectionFormDTO) => Promise<void>;
}

export const useSectionForm = ({ initialData, onSubmit }: UseSectionFormParams) => {
  const [formData, setFormData] = useState<SectionFormDTO>(
    initialData || {
      title: "",
      content: "",
      kind: "text",
    },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [bulletItems, setBulletItems] = useState<string[]>(
    formData.kind === "bullets" ? parseBullets(formData.content) : [""],
  );
  const [draggedBulletIndex, setDraggedBulletIndex] = useState<number | null>(null);

  const [tableData, setTableData] = useState<TableData>(
    formData.kind === "table"
      ? parseTable(formData.content)
      : { columns: ["Columna 1"], rows: [[""], [""]] },
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
    [errors],
  );

  const handleKindChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newKind = e.target.value as SectionFormDTO["kind"];

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
  }, []);

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
    [bulletItems],
  );

  const removeBullet = useCallback(
    (index: number) => {
      const newItems = bulletItems.filter((_, i) => i !== index);
      setBulletItems(newItems);
      setFormData((prev) => ({ ...prev, content: serializeBullets(newItems) }));
    },
    [bulletItems],
  );

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
      if (tableData.columns.length <= 1) {
        return;
      }
      const newData = {
        ...tableData,
        columns: tableData.columns.filter((_, i) => i !== colIndex),
        rows: tableData.rows.map((row) => row.filter((_, i) => i !== colIndex)),
      };
      setTableData(newData);
      setFormData((prev) => ({ ...prev, content: serializeTable(newData) }));
    },
    [tableData],
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
      if (tableData.rows.length <= 1) {
        return;
      }
      const newData = {
        ...tableData,
        rows: tableData.rows.filter((_, i) => i !== rowIndex),
      };
      setTableData(newData);
      setFormData((prev) => ({ ...prev, content: serializeTable(newData) }));
    },
    [tableData],
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
    [tableData],
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
    [tableData],
  );

  const handleBulletDragStart = useCallback((index: number) => {
    setDraggedBulletIndex(index);
  }, []);

  const handleBulletDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleBulletDrop = useCallback(
    (targetIndex: number) => {
      if (draggedBulletIndex === null || draggedBulletIndex === targetIndex) {
        return;
      }

      const newItems = [...bulletItems];
      const [draggedItem] = newItems.splice(draggedBulletIndex, 1);
      newItems.splice(targetIndex, 0, draggedItem);

      setBulletItems(newItems);
      setFormData((prev) => ({ ...prev, content: serializeBullets(newItems) }));
      setDraggedBulletIndex(null);
    },
    [bulletItems, draggedBulletIndex],
  );

  const handleRowDragStart = useCallback((index: number) => {
    setDraggedRowIndex(index);
  }, []);

  const handleRowDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleRowDrop = useCallback(
    (targetIndex: number) => {
      if (draggedRowIndex === null || draggedRowIndex === targetIndex) {
        return;
      }

      const newRows = [...tableData.rows];
      const [draggedRow] = newRows.splice(draggedRowIndex, 1);
      newRows.splice(targetIndex, 0, draggedRow);

      const newData = { ...tableData, rows: newRows };
      setTableData(newData);
      setFormData((prev) => ({ ...prev, content: serializeTable(newData) }));
      setDraggedRowIndex(null);
    },
    [draggedRowIndex, tableData],
  );

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
    [formData, onSubmit],
  );

  return {
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
  };
};
