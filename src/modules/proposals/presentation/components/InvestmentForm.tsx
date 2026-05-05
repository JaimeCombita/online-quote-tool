"use client";

import { ProposalInvestment } from "../../domain/entities/Proposal";
import {
  formatNumberDisplay,
  parseFormattedNumber,
  useInvestmentForm,
} from "../hooks/forms/useInvestmentForm";

interface InvestmentFormProps {
  initialData: ProposalInvestment;
  currency: "COP" | "USD";
  onSubmit: (data: ProposalInvestment) => Promise<void>;
}

const currencyFormatterByCode = {
  COP: new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }),
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }),
};

export function InvestmentForm({ initialData, currency, onSubmit }: InvestmentFormProps) {
  const {
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
  } = useInvestmentForm({
    initialData,
    onSubmit,
  });
  const formatter = currencyFormatterByCode[currency];

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={formData.enabled}
            onChange={(event) => {
              setFormData((current) => ({ ...current, enabled: event.target.checked }));
            }}
            className="h-4 w-4 rounded border-slate-300 text-sky-700"
          />
          Incluir bloque de inversion
        </label>

        <div>
          <label className="block text-sm font-medium text-slate-700">Titulo del bloque</label>
          <input
            type="text"
            value={formData.title}
            onChange={(event) => {
              setFormData((current) => ({ ...current, title: event.target.value }));
            }}
            className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nota comercial</label>
          <textarea
            value={formData.note || ""}
            onChange={(event) => {
              setFormData((current) => ({ ...current, note: event.target.value }));
            }}
            rows={4}
            className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
            placeholder="Incluye condiciones, alcance o aclaraciones..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Vigencia de la oferta (dias)</label>
          <input
            type="number"
            min="0"
            value={formData.offerValidityDays ?? 30}
            onChange={(event) => {
              setFormData((current) => ({
                ...current,
                offerValidityDays: Number(event.target.value),
              }));
            }}
            className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Filas de inversion</h3>
            <p className="text-xs text-slate-500">Configura conceptos, cantidades, impuestos y total.</p>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-800"
          >
            + Agregar fila
          </button>
        </div>

        <div className="space-y-3">
          {formData.rows.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
              No hay filas registradas todavia.
            </div>
          )}

          {formData.rows.map((row) => {
            const rowSubtotal = row.quantity * row.unitPrice;
            const rowTax = rowSubtotal * (row.taxRate / 100);
            const rowTotal = rowSubtotal + rowTax;

            return (
              <div key={row.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                  <div className="xl:col-span-2">
                    <label className="block text-xs font-medium text-slate-600">Concepto</label>
                    <input
                      type="text"
                      value={row.concept}
                      onChange={(event) => updateRow(row.id, "concept", event.target.value)}
                      className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="xl:col-span-2">
                    <label className="block text-xs font-medium text-slate-600">Descripcion</label>
                    <input
                      type="text"
                      value={row.description}
                      onChange={(event) => updateRow(row.id, "description", event.target.value)}
                      className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600">Cantidad</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={row.quantity}
                      onChange={(event) => updateRow(row.id, "quantity", Number(event.target.value))}
                      className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600">Valor unitario</label>
                    <input
                      type="text"
                      value={formatNumberDisplay(row.unitPrice)}
                      onChange={(event) => {
                        const parsed = parseFormattedNumber(event.target.value);
                        if (!isNaN(parsed)) {
                          updateRow(row.id, "unitPrice", parsed);
                        }
                      }}
                      onBlur={(event) => {
                        const parsed = parseFormattedNumber(event.target.value);
                        if (!isNaN(parsed)) {
                          updateRow(row.id, "unitPrice", parsed);
                        }
                      }}
                      className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600">Impuesto %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={row.taxRate}
                      onChange={(event) => updateRow(row.id, "taxRate", Number(event.target.value))}
                      className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-3">
                  <p>Subtotal: <span className="font-medium text-slate-900">{formatter.format(rowSubtotal)}</span></p>
                  <p>Impuesto: <span className="font-medium text-slate-900">{formatter.format(rowTax)}</span></p>
                  <p>Total: <span className="font-medium text-slate-900">{formatter.format(rowTotal)}</span></p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm md:grid-cols-3">
        <p>Subtotal general: <span className="font-semibold text-slate-900">{formatter.format(subtotal)}</span></p>
        <p>Impuestos: <span className="font-semibold text-slate-900">{formatter.format(totalTax)}</span></p>
        <p>Total: <span className="font-semibold text-slate-900">{formatter.format(total)}</span></p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !hasChanges}
          className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800 disabled:opacity-50"
        >
          {isSubmitting ? "Guardando..." : "Guardar inversion"}
        </button>
      </div>
    </form>
  );
}