"use client";

import { useCallback, useMemo, useState } from "react";
import { createProposalModule } from "../../composition/proposalModule";
import { PROPOSAL_DRAFT_STORAGE_KEY } from "../../infrastructure/browser/BrowserProposalDraftRepository";

interface DraftSummary {
  count: number;
  lastDraftId: string;
}

const readDraftSummaryFromStorage = (): DraftSummary => {
  if (typeof window === "undefined") {
    return { count: 0, lastDraftId: "" };
  }

  const rawValue = window.localStorage.getItem(PROPOSAL_DRAFT_STORAGE_KEY);
  if (!rawValue) {
    return { count: 0, lastDraftId: "" };
  }

  try {
    const parsed = JSON.parse(rawValue) as Array<{ id?: string }>;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return { count: 0, lastDraftId: "" };
    }

    return {
      count: parsed.length,
      lastDraftId: parsed[parsed.length - 1]?.id ?? "",
    };
  } catch {
    return { count: 0, lastDraftId: "" };
  }
};

export function ProposalModuleBootstrap() {
  const initialSummary = readDraftSummaryFromStorage();
  const [draftCount, setDraftCount] = useState<number>(initialSummary.count);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastDraftId, setLastDraftId] = useState<string>(initialSummary.lastDraftId);
  const proposalModule = useMemo(() => createProposalModule(), []);

  const refreshDrafts = useCallback(async () => {
    setLoading(true);
    const drafts = await proposalModule.listProposalDrafts.execute();
    setDraftCount(drafts.length);
    setLastDraftId(drafts[drafts.length - 1]?.snapshot.id ?? "");
    setLoading(false);
  }, [proposalModule]);

  const createDraft = useCallback(async () => {
    const draft = await proposalModule.createProposalDraft.execute();
    setLastDraftId(draft.snapshot.id);
    await refreshDrafts();
  }, [proposalModule, refreshDrafts]);

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
