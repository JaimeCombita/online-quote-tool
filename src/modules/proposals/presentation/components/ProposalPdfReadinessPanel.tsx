import { ProposalPdfValidationResult } from "../../domain/entities/Proposal";

interface ProposalPdfReadinessPanelProps {
  validation: ProposalPdfValidationResult;
  compact?: boolean;
}

export function ProposalPdfReadinessPanel({
  validation,
  compact = false,
}: ProposalPdfReadinessPanelProps) {
  if (compact) {
    return validation.isValid ? (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
        Lista para PDF
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
        Faltan requisitos PDF
      </span>
    );
  }

  return (
    <section
      className={`rounded-lg border p-4 ${
        validation.isValid
          ? "border-green-200 bg-green-50"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Validacion previa a PDF</h2>
          <p className="mt-1 text-sm text-slate-600">
            Este estado aplica el contrato MVP antes de habilitar la generacion del PDF.
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            validation.isValid
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {validation.isValid ? "Lista para PDF" : "Pendiente de completar"}
        </span>
      </div>

      {validation.isValid ? (
        <p className="mt-3 text-sm text-green-800">
          La propuesta cumple los requisitos minimos para el flujo de PDF.
        </p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm text-amber-900">
          {validation.issues.map((issue) => (
            <li key={issue.code} className="rounded-md bg-white/70 px-3 py-2">
              {issue.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}