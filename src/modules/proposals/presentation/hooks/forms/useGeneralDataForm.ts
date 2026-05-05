import { useCallback, useState } from "react";
import { GeneralDataFormInitialData } from "../../../application/mappers/proposalEditorMapper";
import { GeneralFormDTO, GeneralFormSchema, hasGeneralFormChanges } from "../../../application/dtos/schemas";
import { ZodError } from "zod";

interface UseGeneralDataFormParams {
  initialData: GeneralDataFormInitialData;
  onSubmit: (data: GeneralFormDTO) => Promise<void>;
}

export const useGeneralDataForm = ({ initialData, onSubmit }: UseGeneralDataFormParams) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasChanges = hasGeneralFormChanges(initialData, formData);

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

  const handleIssueDateChange = useCallback((value: string) => {
    const newDate = new Date(value).toISOString();
    setFormData((prev) => ({ ...prev, issueDate: newDate }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setErrors({});

      try {
        const validated = GeneralFormSchema.parse(formData);
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
    hasChanges,
    handleChange,
    handleIssueDateChange,
    handleSubmit,
  };
};
