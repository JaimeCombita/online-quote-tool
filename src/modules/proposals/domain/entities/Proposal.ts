import { DomainError } from "../errors/DomainError";
import { PROPOSAL_TITLE_MAX_LENGTH } from "../constants/proposalConstraints";

export type SectionKind =
  | "text"
  | "bullets"
  | "highlight"
  | "table"
  | "investment";

export interface ProposalSection {
  id: string;
  title: string;
  content: string;
  kind: SectionKind;
  isVisible: boolean;
}

export interface InvestmentRow {
  id: string;
  concept: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface ProposalInvestment {
  enabled: boolean;
  title: string;
  rows: InvestmentRow[];
  note?: string;
  offerValidityDays?: number;
  showTotals?: boolean;
}

export interface ProposalMetadata {
  title: string;
  issueDate: string;
  city?: string;
  currency: "COP" | "USD";
  version?: number;
  lastPublishedContentHash?: string;
  lastPublishedAt?: string;
}

export interface ProposalClientInfo {
  name: string;
  company?: string;
  contactName?: string;
  phone: string;
  email: string;
}

export interface ProposalIssuerProfile {
  businessName: string;
  responsibleName: string;
  role: string;
  email: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  signatureText: string;
  signatureFont:
    | "script-elegant"
    | "script-formal"
    | "script-hand"
    | "serif-classic"
    | "sans-clean"
    | "modern-sign";
}

export interface ProposalProps {
  id: string;
  metadata: ProposalMetadata;
  client: ProposalClientInfo;
  issuer: ProposalIssuerProfile;
  sections: ProposalSection[];
  investment: ProposalInvestment;
  closingText?: string;
  showSignature: boolean;
  publicationState?: {
    hasUnpublishedChanges: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export type ProposalPdfValidationCode =
  | "missing-title"
  | "missing-client-name"
  | "missing-issue-date"
  | "missing-visible-section"
  | "expired-offer-validity";

export interface ProposalPdfValidationIssue {
  code: ProposalPdfValidationCode;
  message: string;
}

export interface ProposalPdfValidationResult {
  isValid: boolean;
  issues: ProposalPdfValidationIssue[];
}

const defaultIssuerProfile: ProposalIssuerProfile = {
  businessName: "JC Engine",
  responsibleName: "Jaime Combita",
  role: "Director",
  email: "hola@jcengine.com",
  phone: "+57 000 000 0000",
  website: "https://jcengine.com",
  logoUrl: "",
  signatureText: "Jaime Combita V.",
  signatureFont: "script-elegant",
};

export class Proposal {
  private constructor(private readonly props: ProposalProps) {}

  private static publicationHash(snapshot: ProposalProps): string {
    const payload = {
      metadata: {
        title: snapshot.metadata.title,
        issueDate: snapshot.metadata.issueDate,
        city: snapshot.metadata.city ?? "",
        currency: snapshot.metadata.currency,
      },
      client: {
        name: snapshot.client.name,
        company: snapshot.client.company ?? "",
        contactName: snapshot.client.contactName ?? "",
        phone: snapshot.client.phone,
        email: snapshot.client.email,
      },
      issuer: {
        businessName: snapshot.issuer.businessName,
        responsibleName: snapshot.issuer.responsibleName,
        role: snapshot.issuer.role,
        email: snapshot.issuer.email,
        phone: snapshot.issuer.phone ?? "",
        website: snapshot.issuer.website ?? "",
        logoUrl: snapshot.issuer.logoUrl ?? "",
        signatureText: snapshot.issuer.signatureText,
        signatureFont: snapshot.issuer.signatureFont,
      },
      sections: snapshot.sections.map((section) => ({
        id: section.id,
        title: section.title,
        content: section.content,
        kind: section.kind,
        isVisible: section.isVisible,
      })),
      investment: {
        enabled: snapshot.investment.enabled,
        title: snapshot.investment.title,
        rows: snapshot.investment.rows.map((row) => ({
          id: row.id,
          concept: row.concept,
          description: row.description,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          taxRate: row.taxRate,
        })),
        note: snapshot.investment.note ?? "",
        offerValidityDays: snapshot.investment.offerValidityDays ?? 30,
        showTotals: snapshot.investment.showTotals ?? true,
      },
      closingText: snapshot.closingText ?? "",
      showSignature: snapshot.showSignature,
    };

    return Proposal.hashText(Proposal.stableSerialize(payload));
  }

  private static stableSerialize(value: unknown): string {
    if (value === null || typeof value !== "object") {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return `[${value.map((item) => Proposal.stableSerialize(item)).join(",")}]`;
    }

    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    return `{${entries
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${Proposal.stableSerialize(entryValue)}`)
      .join(",")}}`;
  }

  private static hashText(value: string): string {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16);
  }

  public static createEmpty(id: string, now: Date): Proposal {
    const isoNow = now.toISOString();

    return new Proposal({
      id,
      metadata: {
        title: "Nueva propuesta comercial",
        issueDate: isoNow,
        city: "",
        currency: "COP",
        version: 1,
        lastPublishedContentHash: "",
        lastPublishedAt: "",
      },
      client: {
        name: "",
        company: "",
        contactName: "",
        phone: "",
        email: "",
      },
      issuer: defaultIssuerProfile,
      sections: [],
      investment: {
        enabled: false,
        title: "Inversion",
        rows: [],
        showTotals: true,
      },
      closingText: "",
      showSignature: true,
      publicationState: {
        hasUnpublishedChanges: false,
      },
      createdAt: isoNow,
      updatedAt: isoNow,
    });
  }

  public static rehydrate(props: ProposalProps): Proposal {
    return new Proposal(props);
  }

  public get snapshot(): ProposalProps {
    return {
      ...this.props,
      metadata: { ...this.props.metadata },
      client: { ...this.props.client },
      issuer: { ...this.props.issuer },
      sections: this.props.sections.map((section) => ({ ...section })),
      investment: {
        ...this.props.investment,
        rows: this.props.investment.rows.map((row) => ({ ...row })),
      },
      publicationState: {
        hasUnpublishedChanges: this.props.publicationState?.hasUnpublishedChanges ?? false,
      },
    };
  }

  public addSection(section: ProposalSection, now: Date): Proposal {
    if (!section.title.trim()) {
      throw new DomainError("Section title is required");
    }

    const next = this.snapshot;
    next.sections.push(section);
      next.publicationState = { hasUnpublishedChanges: true };
    next.updatedAt = now.toISOString();

    return Proposal.rehydrate(next);
  }

  public moveSection(sectionId: string, direction: "up" | "down", now: Date): Proposal {
    const next = this.snapshot;
    const index = next.sections.findIndex((section) => section.id === sectionId);

    if (index === -1) {
      return this;
    }

    if (direction === "up" && index > 0) {
      [next.sections[index - 1], next.sections[index]] = [
        next.sections[index],
        next.sections[index - 1],
      ];
    }

    if (direction === "down" && index < next.sections.length - 1) {
      [next.sections[index], next.sections[index + 1]] = [
        next.sections[index + 1],
        next.sections[index],
      ];
    }

      next.publicationState = { hasUnpublishedChanges: true };
    next.updatedAt = now.toISOString();
    return Proposal.rehydrate(next);
  }

  public deleteSection(sectionId: string, now: Date): Proposal {
    const next = this.snapshot;
    next.sections = next.sections.filter((section) => section.id !== sectionId);
      next.publicationState = { hasUnpublishedChanges: true };
    next.updatedAt = now.toISOString();
    return Proposal.rehydrate(next);
  }

  public updateSection(sectionId: string, updates: Partial<ProposalSection>, now: Date): Proposal {
    const next = this.snapshot;
    const sectionIndex = next.sections.findIndex((section) => section.id === sectionId);

    if (sectionIndex === -1) {
      throw new DomainError(`Section with id ${sectionId} not found`);
    }

    const updatedSection = { ...next.sections[sectionIndex], ...updates };
    
    if (!updatedSection.title.trim()) {
      throw new DomainError("Section title is required");
    }

    next.sections[sectionIndex] = updatedSection;
      next.publicationState = { hasUnpublishedChanges: true };
    next.updatedAt = now.toISOString();
    return Proposal.rehydrate(next);
  }

  public toggleSectionVisibility(sectionId: string, now: Date): Proposal {
    const next = this.snapshot;
    const section = next.sections.find((s) => s.id === sectionId);

    if (!section) {
      throw new DomainError(`Section with id ${sectionId} not found`);
    }

    section.isVisible = !section.isVisible;
      next.publicationState = { hasUnpublishedChanges: true };
    next.updatedAt = now.toISOString();
    return Proposal.rehydrate(next);
  }

  public updateMetadata(metadata: Partial<ProposalMetadata>, now: Date): Proposal {
    const next = this.snapshot;

    if (metadata.title !== undefined && !metadata.title.trim()) {
      throw new DomainError("Title is required");
    }

    if (metadata.title !== undefined && metadata.title.trim().length > PROPOSAL_TITLE_MAX_LENGTH) {
      throw new DomainError(`Title cannot exceed ${PROPOSAL_TITLE_MAX_LENGTH} characters`);
    }

    next.metadata = { ...next.metadata, ...metadata };
      next.publicationState = { hasUnpublishedChanges: true };
    next.updatedAt = now.toISOString();
    return Proposal.rehydrate(next);
  }

  public updateClient(client: Partial<ProposalClientInfo>, now: Date): Proposal {
    const next = this.snapshot;

    if (client.name !== undefined && !client.name.trim()) {
      throw new DomainError("Client name is required");
    }

    next.client = { ...next.client, ...client };
      next.publicationState = { hasUnpublishedChanges: true };
    next.updatedAt = now.toISOString();
    return Proposal.rehydrate(next);
  }

  public updateIssuer(issuer: Partial<ProposalIssuerProfile>, now: Date): Proposal {
    const next = this.snapshot;

    if (issuer.businessName !== undefined && !issuer.businessName.trim()) {
      throw new DomainError("Business name is required");
    }

    if (issuer.responsibleName !== undefined && !issuer.responsibleName.trim()) {
      throw new DomainError("Responsible name is required");
    }

    next.issuer = { ...next.issuer, ...issuer };
      next.publicationState = { hasUnpublishedChanges: true };
    next.updatedAt = now.toISOString();
    return Proposal.rehydrate(next);
  }

  public updateInvestment(investment: Partial<ProposalInvestment>, now: Date): Proposal {
    const next = this.snapshot;
    next.investment = { ...next.investment, ...investment };
      next.publicationState = { hasUnpublishedChanges: true };
    next.updatedAt = now.toISOString();
    return Proposal.rehydrate(next);
  }

  public updateClosing(closingText: string, showSignature: boolean, now: Date): Proposal {
    const next = this.snapshot;
    next.closingText = closingText;
    next.showSignature = showSignature;
      next.publicationState = { hasUnpublishedChanges: true };
    next.updatedAt = now.toISOString();
    return Proposal.rehydrate(next);
  }

  public isOfferExpired(now: Date): boolean {
    if (!this.props.investment.enabled) {
      return false;
    }

    const issueDate = new Date(this.props.metadata.issueDate);
    if (Number.isNaN(issueDate.getTime())) {
      return false;
    }

    const offerValidityDays = this.props.investment.offerValidityDays ?? 30;
    const daysSinceIssue = Math.floor((now.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
    return offerValidityDays - daysSinceIssue <= 0;
  }

  public renewIssueDate(now: Date): Proposal {
    const next = this.snapshot;
    next.metadata.issueDate = now.toISOString();
      next.publicationState = { hasUnpublishedChanges: true };
    next.updatedAt = now.toISOString();
    return Proposal.rehydrate(next);
  }

  public prepareForPublication(now: Date): Proposal {
    const next = this.snapshot;
    const newHash = Proposal.publicationHash(next);
    const lastHash = next.metadata.lastPublishedContentHash ?? "";
    const currentVersion = next.metadata.version ?? 0;

    if (next.publicationState?.hasUnpublishedChanges) {
      if (!lastHash) {
        next.metadata.version = Math.max(currentVersion, 1);
      } else if (newHash !== lastHash) {
        next.metadata.version = Math.max(currentVersion + 1, 1);
      } else if (!next.metadata.version || next.metadata.version < 1) {
        next.metadata.version = 1;
      }

      next.metadata.lastPublishedContentHash = newHash;
      next.metadata.lastPublishedAt = now.toISOString();
        next.publicationState = { hasUnpublishedChanges: false };
    } else if (!next.metadata.version || next.metadata.version < 1) {
      next.metadata.version = Math.max(currentVersion, 1);
      next.metadata.lastPublishedContentHash = newHash;
      next.metadata.lastPublishedAt = now.toISOString();
    }

    next.updatedAt = now.toISOString();
    return Proposal.rehydrate(next);
  }

  public validateForPdf(): ProposalPdfValidationResult {
    const issues: ProposalPdfValidationIssue[] = [];

    if (!this.props.metadata.title.trim()) {
      issues.push({
        code: "missing-title",
        message: "Debes definir un titulo para la propuesta.",
      });
    }

    if (!this.props.client.name.trim()) {
      issues.push({
        code: "missing-client-name",
        message: "Debes definir el nombre del cliente.",
      });
    }

    if (!this.props.metadata.issueDate.trim()) {
      issues.push({
        code: "missing-issue-date",
        message: "Debes definir la fecha de emision.",
      });
    }

    if (!this.props.sections.some((section) => section.isVisible)) {
      issues.push({
        code: "missing-visible-section",
        message: "Debes tener al menos una seccion activa para generar el PDF.",
      });
    }

    if (this.props.investment.enabled) {
      if (this.isOfferExpired(new Date())) {
        issues.push({
          code: "expired-offer-validity",
          message: "La vigencia de la oferta esta expirada. Renueva la propuesta o ajusta la vigencia para continuar.",
        });
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}
