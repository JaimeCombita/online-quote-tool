import { useMemo, useState } from "react";
import { ProposalInvestment } from "../../../domain/entities/Proposal";
import { UuidGenerator } from "../../../infrastructure/system/UuidGenerator";

const numberFormatterDisplay = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const hasInvestmentChanges = (original: ProposalInvestment, current: ProposalInvestment): boolean => {
  return JSON.stringify(original) !== JSON.stringify(current);
};

export const formatNumberDisplay = (value: number): string => {
  return numberFormatterDisplay.format(Math.round(value));
};

export const parseFormattedNumber = (value: string): number => {
  return Number(value.replace(/\./g, ""));
};

interface UseInvestmentFormParams {
  initialData: ProposalInvestment;
  onSubmit: (data: ProposalInvestment) => Promise<void>;
}

export const useInvestmentForm = ({ initialData, onSubmit }: UseInvestmentFormParams) => {
  const [formData, setFormData] = useState<ProposalInvestment>({
    ...initialData,
    showTotals: initialData.showTotals ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idGenerator = useMemo(() => new UuidGenerator(), []);

  const hasChanges = hasInvestmentChanges(initialData, formData);

  const subtotal = formData.rows.reduce((sum, row) => sum + row.quantity * row.unitPrice, 0);
  const totalTax = formData.rows.reduce(
    (sum, row) => sum + row.quantity * row.unitPrice * (row.taxRate / 100),
    0,
  );
  const total = subtotal + totalTax;

  const updateRow = (rowId: string, field: string, value: string | number) => {
    setFormData((current) => ({
      ...current,
      rows: current.rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    }));
  };

  const addRow = () => {
    setFormData((current) => ({
      ...current,
      rows: [
        ...current.rows,
        {
          id: idGenerator.generate(),
          concept: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          taxRate: 0,
        },
      ],
    }));
  };

  const removeRow = (rowId: string) => {
    setFormData((current) => ({
      ...current,
      rows: current.rows.filter((row) => row.id !== rowId),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (formData.enabled && formData.rows.some((row) => !row.concept.trim())) {
      setError("Cada fila de inversion debe tener un concepto.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "No fue posible guardar la inversion.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    isSubmitting,
    error,
    hasChanges,
    subtotal,
    totalTax,
    total,
    updateRow,
    addRow,
    removeRow,
    handleSubmit,
  };
};
