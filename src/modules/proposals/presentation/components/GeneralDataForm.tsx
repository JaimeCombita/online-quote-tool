"use client";

import { GeneralFormDTO } from "../../application/dtos/schemas";
import { useGeneralDataForm } from "../hooks/forms/useGeneralDataForm";

interface GeneralDataFormProps {
  initialData: {
    title: string;
    subtitle: string;
    clientName: string;
    clientCompany: string;
    clientContact: string;
    clientPhone: string;
    clientEmail: string;
    issueDate: string;
    city: string;
    currency: "COP" | "USD";
  };
  onSubmit: (data: GeneralFormDTO) => Promise<void>;
  isLoading?: boolean;
}

export function GeneralDataForm({ initialData, onSubmit, isLoading = false }: GeneralDataFormProps) {
  const {
    formData,
    errors,
    isSubmitting,
    hasChanges,
    handleChange,
    handleIssueDateChange,
    handleSubmit,
  } = useGeneralDataForm({
    initialData,
    onSubmit,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          <label className="block text-sm font-medium text-slate-700">Subtitulo</label>
          <input
            type="text"
            name="subtitle"
            value={formData.subtitle}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={isSubmitting || isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Nombre del cliente <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="clientName"
            value={formData.clientName}
            onChange={handleChange}
            className={`mt-1 block w-full rounded border px-3 py-2 text-sm ${
              errors.clientName ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
            }`}
            disabled={isSubmitting || isLoading}
          />
          {errors.clientName && <p className="mt-1 text-xs text-red-600">{errors.clientName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Empresa del cliente</label>
          <input
            type="text"
            name="clientCompany"
            value={formData.clientCompany}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={isSubmitting || isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Contacto (nombre)</label>
          <input
            type="text"
            name="clientContact"
            value={formData.clientContact}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={isSubmitting || isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Telefono del cliente <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="clientPhone"
            value={formData.clientPhone}
            onChange={handleChange}
            className={`mt-1 block w-full rounded border px-3 py-2 text-sm ${
              errors.clientPhone ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
            }`}
            disabled={isSubmitting || isLoading}
          />
          {errors.clientPhone && <p className="mt-1 text-xs text-red-600">{errors.clientPhone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Email del cliente <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="clientEmail"
            value={formData.clientEmail}
            onChange={handleChange}
            className={`mt-1 block w-full rounded border px-3 py-2 text-sm ${
              errors.clientEmail ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
            }`}
            disabled={isSubmitting || isLoading}
          />
          {errors.clientEmail && <p className="mt-1 text-xs text-red-600">{errors.clientEmail}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Fecha de emision</label>
          <input
            type="date"
            name="issueDate"
            value={formData.issueDate.split("T")[0]}
            onChange={(e) => handleIssueDateChange(e.target.value)}
            className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={isSubmitting || isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Ciudad</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={isSubmitting || isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Moneda</label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={isSubmitting || isLoading}
          >
            <option value="COP">COP (Pesos Colombianos)</option>
            <option value="USD">USD (Dolares Estadounidenses)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={isSubmitting || isLoading || !hasChanges}
          className="inline-flex items-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800 disabled:opacity-50"
        >
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
