import { useCallback, useEffect, useState } from "react";
import { IssuerFormDTO, IssuerFormSchema } from "../../../application/dtos/schemas";
import { ZodError } from "zod";

export interface IssuerFormInitialData {
  businessName: string;
  responsibleName: string;
  role: string;
  email: string;
  phone: string;
  website: string;
  logoUrl: string;
  signatureText: string;
  signatureFont:
    | "script-elegant"
    | "script-formal"
    | "script-hand"
    | "serif-classic"
    | "sans-clean"
    | "modern-sign";
}

interface UseIssuerFormParams {
  initialData: IssuerFormInitialData;
  onSubmit: (data: IssuerFormDTO) => Promise<void>;
  onDirtyChange?: (hasChanges: boolean) => void;
}

export const signatureFontOptions: Array<{
  value: IssuerFormInitialData["signatureFont"];
  label: string;
}> = [
  {
    value: "script-elegant",
    label: "Script elegante",
  },
  {
    value: "script-formal",
    label: "Script formal",
  },
  {
    value: "script-hand",
    label: "Manuscrita tecnica",
  },
  {
    value: "serif-classic",
    label: "Serif clasica",
  },
  {
    value: "sans-clean",
    label: "Sans limpia",
  },
  {
    value: "modern-sign",
    label: "Moderna premium",
  },
];

export const signatureFontClassByValue: Record<IssuerFormInitialData["signatureFont"], string> = {
  "script-elegant": "scriptElegant",
  "script-formal": "scriptFormal",
  "script-hand": "scriptHand",
  "serif-classic": "serifClassic",
  "sans-clean": "sansClean",
  "modern-sign": "modernSign",
};

const hasIssuerFormChanges = (original: IssuerFormInitialData, current: IssuerFormInitialData): boolean => {
  return (
    original.businessName !== current.businessName ||
    original.responsibleName !== current.responsibleName ||
    original.role !== current.role ||
    original.email !== current.email ||
    original.phone !== current.phone ||
    original.website !== current.website ||
    original.logoUrl !== current.logoUrl ||
    original.signatureText !== current.signatureText ||
    original.signatureFont !== current.signatureFont
  );
};

export const useIssuerForm = ({ initialData, onSubmit, onDirtyChange }: UseIssuerFormParams) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasChanges = hasIssuerFormChanges(initialData, formData);

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const toBase64 = async (selectedFile: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("No fue posible leer el archivo de logo."));
        reader.readAsDataURL(selectedFile);
      });
    };

    try {
      const encoded = await toBase64(file);
      setFormData((prev) => ({ ...prev, logoUrl: encoded }));
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.logoUrl;
        return newErrors;
      });
    } catch {
      setErrors((prev) => ({ ...prev, logoUrl: "No fue posible cargar el archivo de logo." }));
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      setErrors({});

      try {
        const validated = IssuerFormSchema.parse(formData);
        await onSubmit(validated);
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldErrors: Record<string, string> = {};
          error.issues.forEach((issue) => {
            const path = issue.path.join(".");
            fieldErrors[path] = issue.message;
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
    handleLogoUpload,
    handleSubmit,
  };
};
