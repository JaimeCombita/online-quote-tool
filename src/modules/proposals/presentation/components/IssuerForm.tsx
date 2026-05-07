"use client";

import { IssuerFormDTO } from "../../application/dtos/schemas";
import {
  IssuerFormInitialData,
  signatureFontClassByValue,
  signatureFontOptions,
  useIssuerForm,
} from "../hooks/forms/useIssuerForm";
import signatureFontStyles from "../styles/SignatureFonts.module.css";

interface IssuerFormProps {
  initialData: IssuerFormInitialData;
  onSubmit: (data: IssuerFormDTO) => Promise<void>;
  isLoading?: boolean;
  onDirtyChange?: (hasChanges: boolean) => void;
}

export function IssuerForm({ initialData, onSubmit, isLoading = false, onDirtyChange }: IssuerFormProps) {
  const {
    formData,
    errors,
    isSubmitting,
    hasChanges,
    handleChange,
    handleLogoUpload,
    handleSubmit,
  } = useIssuerForm({
    initialData,
    onSubmit,
    onDirtyChange,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Nombre empresa <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            className={`mt-1 block w-full rounded border px-3 py-2 text-sm ${
              errors.businessName ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
            }`}
            disabled={isSubmitting || isLoading}
          />
          {errors.businessName && <p className="mt-1 text-xs text-red-600">{errors.businessName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Nombre responsable <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="responsibleName"
            value={formData.responsibleName}
            onChange={handleChange}
            className={`mt-1 block w-full rounded border px-3 py-2 text-sm ${
              errors.responsibleName ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
            }`}
            disabled={isSubmitting || isLoading}
          />
          {errors.responsibleName && <p className="mt-1 text-xs text-red-600">{errors.responsibleName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Cargo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={`mt-1 block w-full rounded border px-3 py-2 text-sm ${
              errors.role ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
            }`}
            disabled={isSubmitting || isLoading}
          />
          {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`mt-1 block w-full rounded border px-3 py-2 text-sm ${
              errors.email ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
            }`}
            disabled={isSubmitting || isLoading}
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Telefono</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={isSubmitting || isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Sitio web</label>
          <input
            type="text"
            name="website"
            value={formData.website}
            onChange={handleChange}
            className={`mt-1 block w-full rounded border px-3 py-2 text-sm ${
              errors.website ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
            }`}
            placeholder="https://miempresa.com"
            disabled={isSubmitting || isLoading}
          />
          {errors.website && <p className="mt-1 text-xs text-red-600">{errors.website}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Logo (URL o carga local)</label>
          <input
            type="text"
            name="logoUrl"
            value={formData.logoUrl}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
            placeholder="https://... o data:image/..."
            disabled={isSubmitting || isLoading}
          />
          <label className="mt-2 inline-flex cursor-pointer items-center rounded bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200">
            Subir logo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoUpload}
              className="hidden"
              disabled={isSubmitting || isLoading}
            />
          </label>
          {errors.logoUrl && <p className="mt-1 text-xs text-red-600">{errors.logoUrl}</p>}
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Previsualizacion logo</p>
          {formData.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={formData.logoUrl} alt="Logo emisor" className="h-12 w-auto object-contain" />
          ) : (
            <p className="text-xs text-slate-500">Usando logo corporativo por defecto.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Texto de firma</label>
          <input
            type="text"
            name="signatureText"
            value={formData.signatureText}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={isSubmitting || isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Tipografia firma</label>
          <select
            name="signatureFont"
            value={formData.signatureFont}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={isSubmitting || isLoading}
          >
            {signatureFontOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs font-medium text-slate-500">Como se vera la firma con esta tipografia</p>
            <p
              className={`mt-1 text-3xl text-slate-900 ${
                signatureFontStyles[signatureFontClassByValue[formData.signatureFont]]
              }`}
            >
              {formData.signatureText || "Jaime Combita V."}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">Vista previa emisor y firma</p>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Emisor</p>
              <h4 className="mt-2 text-lg font-semibold text-slate-900">{formData.businessName || "Nombre empresa"}</h4>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <p>{formData.responsibleName || "Nombre responsable"} · {formData.role || "Cargo"}</p>
                <p>{formData.email || "correo@empresa.com"}</p>
                {formData.phone && <p>{formData.phone}</p>}
                {formData.website && <p>{formData.website}</p>}
              </div>
            </div>
            <div className="h-12 w-24 shrink-0 rounded border border-slate-200 bg-slate-50 p-2">
              {formData.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={formData.logoUrl} alt="Logo emisor" className="h-full w-full object-contain" />
              ) : (
                <p className="text-center text-[10px] text-slate-400">Sin logo</p>
              )}
            </div>
          </div>
          <div className="pt-4 text-center">
            <p
              className={`text-4xl text-slate-900 ${
                signatureFontStyles[signatureFontClassByValue[formData.signatureFont]]
              }`}
            >
              {formData.signatureText || formData.responsibleName || "Firma"}
            </p>
            <div className="mx-auto mt-2 h-px w-56 bg-slate-400" />
            <p className="mt-2 text-sm font-medium text-slate-900">{formData.responsibleName || "Nombre responsable"}</p>
            <p className="text-sm text-slate-500">{formData.role || "Cargo"}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || isLoading || !hasChanges}
          className="inline-flex items-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800 disabled:opacity-50"
        >
          {isSubmitting ? "Guardando..." : "Guardar datos emisor"}
        </button>
      </div>
    </form>
  );
}
