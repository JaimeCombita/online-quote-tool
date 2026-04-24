"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { createProposalModule } from "../../composition/proposalModule";
import { Proposal, ProposalSection } from "../../domain/entities/Proposal";
import { GeneralFormDTO } from "../../application/dtos/schemas";
import { SectionFormDTO } from "../../application/dtos/schemas";
import { GeneralDataForm } from "./GeneralDataForm";
import { ProposalHtmlPreview } from "./ProposalHtmlPreview";
import { InvestmentForm } from "./InvestmentForm";
import { ProposalPdfReadinessPanel } from "./ProposalPdfReadinessPanel";
import { SectionForm } from "./SectionForm";
import { SectionsList } from "./SectionsList";
import { UuidGenerator } from "../../infrastructure/system/UuidGenerator";

interface ProposalEditorProps {
  proposalId: string;
}

type EditorTab = "general" | "sections" | "investment" | "closing" | "preview";
type SectionAction = "list" | "create" | "edit";
const A4_PREVIEW_WIDTH_PX = 595;
const A4_PREVIEW_HEIGHT_PX = 842;

export function ProposalEditor({ proposalId }: ProposalEditorProps) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("general");
  const [sectionAction, setSectionAction] = useState<SectionAction>("list");
  const [editingSection, setEditingSection] = useState<ProposalSection | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showExportImport, setShowExportImport] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isEmailPanelOpen, setIsEmailPanelOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const proposalModule = useMemo(() => createProposalModule(), []);
  const idGenerator = useMemo(() => new UuidGenerator(), []);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedAutoSave = useRef(false);
  const previewPagesContainerRef = useRef<HTMLDivElement | null>(null);

  const buildPreviewPdfBlob = useCallback(async (): Promise<Blob> => {
    if (!previewPagesContainerRef.current) {
      throw new Error("No se encontro la vista previa para exportar.");
    }

    const pageElements = Array.from(
      previewPagesContainerRef.current.querySelectorAll<HTMLElement>("[data-preview-page='true']"),
    );

    if (pageElements.length === 0) {
      throw new Error("No hay hojas en la vista previa para generar PDF.");
    }

    const [{ toPng }, { jsPDF }] = await Promise.all([
      import("html-to-image"),
      import("jspdf"),
    ]);

    if (typeof document !== "undefined" && "fonts" in document) {
      await document.fonts.ready;
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    for (let index = 0; index < pageElements.length; index += 1) {
      const pageElement = pageElements[index];
      const imageData = await toPng(pageElement, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: A4_PREVIEW_WIDTH_PX,
        height: A4_PREVIEW_HEIGHT_PX,
        style: {
          width: `${A4_PREVIEW_WIDTH_PX}px`,
          height: `${A4_PREVIEW_HEIGHT_PX}px`,
          maxWidth: `${A4_PREVIEW_WIDTH_PX}px`,
          maxHeight: `${A4_PREVIEW_HEIGHT_PX}px`,
          margin: "0",
        },
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      if (index > 0) {
        pdf.addPage();
      }

      // Preview pages are rendered with A4 proportions, so we map 1:1 to full PDF page.
      pdf.addImage(imageData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
    }

    return pdf.output("blob");
  }, []);

  const blobToBase64 = useCallback(async (blob: Blob): Promise<string> => {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = "";

    for (let index = 0; index < bytes.length; index += chunkSize) {
      const chunk = bytes.subarray(index, index + chunkSize);
      binary += String.fromCharCode(...chunk);
    }

    return btoa(binary);
  }, []);

  // Load proposal
  useEffect(() => {
    const loadProposal = async () => {
      try {
        setIsLoading(true);
        const loaded = await proposalModule.listProposalDrafts.execute();
        const current = loaded.find((p) => p.snapshot.id === proposalId);
        if (current) {
          setProposal(current);
          setRecipientEmail(current.snapshot.client.email ?? "");
          setEmailSubject(`Propuesta comercial - ${current.snapshot.metadata.title}`);
          setEmailMessage(
            [
              `Hola ${current.snapshot.client.name || ""},`,
              "",
              "Adjunto encontrarás la propuesta comercial solicitada.",
              "",
              "Quedo atento(a) a tus comentarios.",
              "",
              `${current.snapshot.issuer.responsibleName}`,
              `${current.snapshot.issuer.role}`,
              `${current.snapshot.issuer.businessName}`,
            ].join("\n"),
          );
        } else {
          setError("Proposal not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load proposal");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProposal();
  }, [proposalId, proposalModule]);

  // Auto-save effect
  useEffect(() => {
    if (!proposal) return;

    if (!hasInitializedAutoSave.current) {
      hasInitializedAutoSave.current = true;
      return;
    }

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        setAutoSaveStatus("saving");
        await proposalModule.saveProposalSnapshot.execute(proposal.snapshot);
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2000);
      } catch (err) {
        console.error("Auto-save failed:", err);
        setAutoSaveStatus("idle");
      }
    }, 1000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [proposal, proposalModule]);

  const handleGeneralDataSubmit = useCallback(
    async (data: GeneralFormDTO) => {
      if (!proposal) return;

      try {
        const updated = await proposalModule.updateProposalDraft.execute({
          proposalId: proposal.snapshot.id,
          metadata: {
            title: data.title,
            subtitle: data.subtitle,
            issueDate: data.issueDate,
            city: data.city,
            currency: data.currency,
          },
          client: {
            name: data.clientName,
            company: data.clientCompany,
            contactName: data.clientContact,
            phone: data.clientPhone,
            email: data.clientEmail,
          },
        });
        setProposal(updated);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update proposal");
      }
    },
    [proposal, proposalModule]
  );

  const handleAddSection = useCallback(
    async (data: SectionFormDTO) => {
      if (!proposal) return;

      try {
        const newSection: ProposalSection = {
          id: idGenerator.generate(),
          title: data.title,
          content: data.content,
          kind: data.kind,
          isVisible: true,
        };

        const updated = await proposalModule.addSection.execute(proposal.snapshot.id, newSection);
        setProposal(updated);
        setSectionAction("list");
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add section");
      }
    },
    [proposal, proposalModule, idGenerator]
  );

  const handleUpdateSection = useCallback(
    async (data: SectionFormDTO) => {
      if (!proposal || !editingSection) return;

      try {
        const updated = await proposalModule.updateSection.execute(
          proposal.snapshot.id,
          editingSection.id,
          {
            title: data.title,
            content: data.content,
            kind: data.kind,
          },
        );
        setProposal(updated);
        setSectionAction("list");
        setEditingSection(null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update section");
      }
    },
    [proposal, proposalModule, editingSection]
  );

  const handleDeleteSection = useCallback(
    async (sectionId: string) => {
      if (!proposal) return;

      try {
        const updated = await proposalModule.deleteSection.execute(proposal.snapshot.id, sectionId);
        setProposal(updated);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete section");
      }
    },
    [proposal, proposalModule]
  );

  const handleMoveSection = useCallback(
    async (sectionId: string, direction: "up" | "down") => {
      if (!proposal) return;

      try {
        const updated = await proposalModule.moveSection.execute(
          proposal.snapshot.id,
          sectionId,
          direction,
        );
        setProposal(updated);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to move section");
      }
    },
    [proposal, proposalModule]
  );

  const handleToggleSectionVisibility = useCallback(
    async (sectionId: string) => {
      if (!proposal) return;

      try {
        const updated = await proposalModule.toggleSectionVisibility.execute(
          proposal.snapshot.id,
          sectionId,
        );
        setProposal(updated);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to toggle section visibility");
      }
    },
    [proposal, proposalModule]
  );

  const handleClosingSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!proposal) {
        return;
      }

      const formData = new FormData(event.currentTarget);
      const closingText = String(formData.get("closingText") ?? "");
      const showSignature = formData.get("showSignature") === "on";

      try {
        const updated = await proposalModule.updateProposalDraft.execute({
          proposalId: proposal.snapshot.id,
          closingText,
          showSignature,
        });
        setProposal(updated);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update closing section");
      }
    },
    [proposal, proposalModule],
  );

  const handleInvestmentSubmit = useCallback(
    async (investment: Proposal["snapshot"]["investment"]) => {
      if (!proposal) {
        return;
      }

      try {
        const updated = await proposalModule.updateProposalDraft.execute({
          proposalId: proposal.snapshot.id,
          investment,
        });
        setProposal(updated);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update investment block");
      }
    },
    [proposal, proposalModule],
  );

  const handleExport = useCallback(async () => {
    if (!proposal) return;

    try {
      const json = await proposalModule.exportProposal.execute(proposal.snapshot.id);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proposal-${proposal.snapshot.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export proposal");
    }
  }, [proposal, proposalModule]);

  const handleImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const content = await file.text();
        const imported = await proposalModule.importProposal.execute(content);
        setProposal(imported);
        setError(null);
        setShowExportImport(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to import proposal");
      }
    },
    [proposalModule]
  );

  const handleGeneratePdf = useCallback(async () => {
    if (!proposal) {
      return;
    }

    setIsGeneratingPdf(true);

    try {
      const blob = await buildPreviewPdfBlob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${proposal.snapshot.metadata.title || "propuesta"}.pdf`;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible generar el PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [proposal, buildPreviewPdfBlob]);

  const handleSendEmail = useCallback(async () => {
    if (!proposal) {
      return;
    }

    if (!recipientEmail.trim()) {
      setError("Debes ingresar un correo destinatario para enviar la propuesta.");
      return;
    }

    setIsSendingEmail(true);

    try {
      const previewPdfBlob = await buildPreviewPdfBlob();
      const pdfBase64 = await blobToBase64(previewPdfBlob);

      const response = await fetch("/api/proposals/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({
          proposal: proposal.snapshot,
          to: recipientEmail.trim(),
          subject: emailSubject,
          message: emailMessage,
          pdfBase64,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "No fue posible enviar el correo");
      }

      setError(null);
      setAutoSaveStatus("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible enviar el correo");
    } finally {
      setIsSendingEmail(false);
    }
  }, [proposal, recipientEmail, emailSubject, emailMessage, buildPreviewPdfBlob, blobToBase64]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-slate-600">Cargando propuesta...</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error || "Propuesta no encontrada"}</p>
      </div>
    );
  }

  const snap = proposal.snapshot;
  const pdfValidation = proposal.validateForPdf();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{snap.metadata.title}</h1>
            {snap.metadata.subtitle && (
              <p className="mt-1 text-slate-600">{snap.metadata.subtitle}</p>
            )}
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className="mt-4 inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
            >
              Abrir vista previa HTML
            </button>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>ID: {snap.id}</p>
            <p>Actualizado: {new Date(snap.updatedAt).toLocaleString()}</p>
            <p className="mt-2">
              Estado: 
              <span
                className={`ml-2 inline-block px-2 py-1 rounded text-xs font-medium ${
                  autoSaveStatus === "saving"
                    ? "bg-yellow-100 text-yellow-700"
                    : autoSaveStatus === "saved"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600"
                }`}
              >
                {autoSaveStatus === "saving" ? "Guardando..." : autoSaveStatus === "saved" ? "Guardado" : "Listo"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <ProposalPdfReadinessPanel validation={pdfValidation} />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(["general", "sections", "investment", "closing", "preview"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSectionAction("list");
            }}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === tab
                ? "border-b-2 border-sky-700 text-sky-700"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab === "general" && "Datos generales"}
            {tab === "sections" && "Secciones"}
            {tab === "investment" && "Inversion"}
            {tab === "closing" && "Cierre"}
            {tab === "preview" && "Vista previa HTML"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        {/* General Tab */}
        {activeTab === "general" && (
          <GeneralDataForm
            initialData={{
              title: snap.metadata.title,
              subtitle: snap.metadata.subtitle || "",
              clientName: snap.client.name,
              clientCompany: snap.client.company || "",
              clientContact: snap.client.contactName || "",
              clientPhone: snap.client.phone || "",
              clientEmail: snap.client.email || "",
              issueDate: snap.metadata.issueDate,
              city: snap.metadata.city || "",
              currency: snap.metadata.currency,
            }}
            onSubmit={handleGeneralDataSubmit}
            isLoading={isLoading}
          />
        )}

        {/* Sections Tab */}
        {activeTab === "sections" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900">Secciones</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowExportImport(!showExportImport)}
                  className="text-sm px-3 py-1.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                  {showExportImport ? "Ocultar" : "Mostrar"} export/import
                </button>
                {sectionAction === "list" && (
                  <button
                    onClick={() => setSectionAction("create")}
                    className="text-sm px-3 py-1.5 rounded bg-sky-700 text-white hover:bg-sky-800 transition"
                  >
                    + Nueva seccion
                  </button>
                )}
              </div>
            </div>

            {showExportImport && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="text-sm px-3 py-1.5 rounded bg-sky-600 text-white hover:bg-sky-700 transition"
                  >
                    📥 Descargar JSON
                  </button>
                  <label className="text-sm px-3 py-1.5 rounded bg-sky-600 text-white hover:bg-sky-700 transition cursor-pointer">
                    📤 Importar JSON
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {sectionAction === "create" && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Nueva seccion</h3>
                <SectionForm
                  onSubmit={handleAddSection}
                  onCancel={() => setSectionAction("list")}
                />
              </div>
            )}

            {sectionAction === "edit" && editingSection && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Editar seccion</h3>
                <SectionForm
                  initialData={{
                    title: editingSection.title,
                    content: editingSection.content,
                    kind: editingSection.kind,
                  }}
                  onSubmit={handleUpdateSection}
                  onCancel={() => {
                    setSectionAction("list");
                    setEditingSection(null);
                  }}
                  isEditing={true}
                />
              </div>
            )}

            {sectionAction === "list" && (
              <SectionsList
                sections={snap.sections}
                onDelete={handleDeleteSection}
                onMoveUp={(id) => handleMoveSection(id, "up")}
                onMoveDown={(id) => handleMoveSection(id, "down")}
                onToggleVisibility={handleToggleSectionVisibility}
                onEdit={(section) => {
                  setEditingSection(section);
                  setSectionAction("edit");
                }}
              />
            )}
          </div>
        )}

        {activeTab === "investment" && (
          <InvestmentForm
            key={snap.updatedAt}
            initialData={snap.investment}
            currency={snap.metadata.currency}
            onSubmit={handleInvestmentSubmit}
          />
        )}

        {/* Closing Tab */}
        {activeTab === "closing" && (
          <form className="space-y-4" onSubmit={handleClosingSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Texto de cierre</label>
              <textarea
                name="closingText"
                defaultValue={snap.closingText || ""}
                rows={6}
                className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="Escribe un mensaje final para el cliente..."
              />
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="showSignature"
                defaultChecked={snap.showSignature}
                className="h-4 w-4 rounded border-slate-300 text-sky-700"
              />
              Mostrar firma en el cierre
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800"
              >
                Guardar cierre
              </button>
            </div>
          </form>
        )}

        {activeTab === "preview" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-700">
                El PDF se genera al momento de solicitarlo y no se guarda en almacenamiento local.
              </p>
              <button
                type="button"
                onClick={() => {
                  void handleGeneratePdf();
                }}
                disabled={!pdfValidation.isValid || isGeneratingPdf}
                className="inline-flex items-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGeneratingPdf ? "Generando PDF..." : "Generar PDF ahora"}
              </button>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setIsEmailPanelOpen((current) => !current)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Enviar propuesta por email</h3>
                  <p className="text-sm text-slate-600">
                    El adjunto PDF se genera bajo demanda en el momento del envio y no se almacena.
                  </p>
                </div>
                <span className="text-slate-500">{isEmailPanelOpen ? "▲" : "▼"}</span>
              </button>

              {isEmailPanelOpen && (
                <div className="space-y-4 border-t border-slate-200 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Destinatario</label>
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(event) => setRecipientEmail(event.target.value)}
                        className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
                        placeholder="cliente@empresa.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">Asunto</label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(event) => setEmailSubject(event.target.value)}
                        className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Mensaje</label>
                    <textarea
                      value={emailMessage}
                      onChange={(event) => setEmailMessage(event.target.value)}
                      rows={7}
                      className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        void handleSendEmail();
                      }}
                      disabled={!pdfValidation.isValid || isSendingEmail}
                      className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSendingEmail ? "Enviando..." : "Enviar por email"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <ProposalHtmlPreview proposal={proposal} pagesContainerRef={previewPagesContainerRef} />
          </div>
        )}
      </div>
    </div>
  );
}
