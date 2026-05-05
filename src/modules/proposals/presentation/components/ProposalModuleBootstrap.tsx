"use client";

import { useProposalModuleBootstrap } from "../hooks/useProposalModuleBootstrap";

export function ProposalModuleBootstrap() {
  const { draftCount, loading, lastDraftId, refreshDrafts, createDraft } =
    useProposalModuleBootstrap();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Base DDD lista</h2>
      <p className="mt-2 text-sm text-slate-600">
        Ya quedo creado el modulo de propuestas con capas de dominio, aplicacion e
        infraestructura.
      </p>

      <div className="mt-4 grid gap-2 text-sm text-slate-700">
        <p>
          Estado borradores locales: {loading ? "cargando..." : `${draftCount} registrados`}
        </p>
        <p>Ultimo borrador: {lastDraftId || "ninguno"}</p>
      </div>

      <button
        type="button"
        onClick={() => {
          void createDraft();
        }}
        className="mt-5 inline-flex items-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800"
      >
        Crear borrador de prueba
      </button>

      <button
        type="button"
        onClick={() => {
          void refreshDrafts();
        }}
        className="ml-3 mt-5 inline-flex items-center rounded-lg border border-sky-700 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-50"
      >
        Actualizar listado
      </button>
    </section>
  );
}
