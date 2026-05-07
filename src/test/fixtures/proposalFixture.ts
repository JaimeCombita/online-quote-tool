import { Proposal, ProposalProps } from "@/modules/proposals/domain/entities/Proposal";

export const buildProposalSnapshot = (overrides: Partial<ProposalProps> = {}): ProposalProps => {
  const now = new Date("2026-01-10T10:00:00.000Z").toISOString();

  return {
    id: "proposal-1",
    metadata: {
      title: "Propuesta QA",
      subtitle: "Automatizacion",
      issueDate: now,
      city: "Bogota",
      currency: "COP",
      ...overrides.metadata,
    },
    client: {
      name: "Cliente Demo",
      company: "Empresa Demo",
      contactName: "Ana Cliente",
      phone: "3001234567",
      email: "cliente@demo.com",
      ...overrides.client,
    },
    issuer: {
      businessName: "JC Engine",
      responsibleName: "Jaime Combita",
      role: "Director",
      email: "hola@jcengine.com",
      phone: "+57 000 000 0000",
      website: "jcengine.co",
      logoUrl: "",
      signatureText: "Jaime Combita V.",
      signatureFont: "script-elegant",
      ...overrides.issuer,
    },
    sections:
      overrides.sections ?? [
        {
          id: "sec-1",
          title: "Introduccion",
          content: "Linea uno\nLinea dos",
          kind: "text",
          isVisible: true,
        },
      ],
    investment: {
      enabled: true,
      title: "Inversion",
      rows: [
        {
          id: "row-1",
          concept: "Servicio",
          description: "Descripcion",
          quantity: 2,
          unitPrice: 100000,
          taxRate: 19,
        },
      ],
      note: "Nota comercial",
      offerValidityDays: 30,
      showTotals: true,
      ...overrides.investment,
    },
    closingText: "Gracias por la oportunidad",
    showSignature: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

export const buildProposal = (overrides: Partial<ProposalProps> = {}): Proposal =>
  Proposal.rehydrate(buildProposalSnapshot(overrides));
