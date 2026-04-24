"use client";

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { createProposalModule } from "../../composition/proposalModule";
import { Proposal } from "../../domain/entities/Proposal";
import { ProposalPdfReadinessPanel } from "./ProposalPdfReadinessPanel";

export function ProposalDashboard() {
  const [drafts, setDrafts] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

  const proposalModule = useMemo(() => createProposalModule(), []);
  const hasInitialized = useRef(false);

  const loadDrafts = useCallback(async () => {
    try {
      setIsLoading(true);
      const loaded = await proposalModule.listProposalDrafts.execute();
      setDrafts(loaded);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drafts");
    } finally {
      setIsLoading(false);
    }
  }, [proposalModule]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadDrafts().catch(console.error);
    }
  }, [loadDrafts]);

  const handleCreateNew = useCallback(async () => {
    try {
      setCreatingNew(true);
      const newDraft = await proposalModule.createProposalDraft.execute();
      setDrafts((prev) => [...prev, newDraft]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create new draft");
    } finally {
      setCreatingNew(false);
    }
  }, [proposalModule]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("¿Estás seguro de que quieres eliminar este borrador?")) {
        return;
      }

      try {
        await proposalModule.deleteProposalDraft.execute(id);
        setDrafts((prev) => prev.filter((d) => d.snapshot.id !== id));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete draft");
      }
    },
    [proposalModule]
  );

  return (
    <div className="space-y-6">
      {/* Create New Button */}
      <div className="flex justify-end">
        <button
          onClick={handleCreateNew}
          disabled={creatingNew || isLoading}
          className="inline-flex items-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800 disabled:opacity-50"
        >
          {creatingNew ? "Creando..." : "+ Nueva propuesta"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-600">Cargando borradores...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && drafts.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-slate-600 mb-4">No hay propuestas todavia.</p>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800"
          >
            Crear la primera propuesta
          </button>
        </div>
      )}

      {/* Drafts List */}
      {!isLoading && drafts.length > 0 && (
        <div className="grid gap-4">
          {drafts.map((draft) => {
            const snap = draft.snapshot;
            const pdfValidation = draft.validateForPdf();
            
            // Calculate validity days remaining
            const issueDate = new Date(snap.metadata.issueDate);
            const today = new Date();
            const daysSinceIssue = Math.floor((today.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
            const offerValidityDays = snap.investment.offerValidityDays ?? 30;
            const daysRemaining = offerValidityDays - daysSinceIssue;
            const isOfferExpired = daysRemaining <= 0;

            return (
              <div
                key={snap.id}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">{snap.metadata.title}</h3>
                      <ProposalPdfReadinessPanel compact={true} validation={pdfValidation} />
                    </div>
                    {snap.metadata.subtitle && (
                      <p className="mt-1 text-sm text-slate-600">{snap.metadata.subtitle}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                      <p>
                        <strong>Cliente:</strong> {snap.client.name}
                      </p>
                      {snap.client.company && (
                        <p>
                          <strong>Empresa:</strong> {snap.client.company}
                        </p>
                      )}
                      <p>
                        <strong>Fecha:</strong> {new Date(snap.metadata.issueDate).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Secciones:</strong> {snap.sections.length}
                      </p>
                      {snap.investment.enabled && (
                        <p className={isOfferExpired ? "text-red-600" : "text-amber-600"}>
                          <strong>Vigencia:</strong> {isOfferExpired ? "Expirada" : `${daysRemaining} dias restantes`}
                        </p>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Actualizado: {new Date(snap.updatedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/editor/${snap.id}`}
                      className="inline-flex items-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(snap.id)}
                      className="inline-flex items-center rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
