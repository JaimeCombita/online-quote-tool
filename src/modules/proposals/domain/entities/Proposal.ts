import { DomainError } from "../errors/DomainError";

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
  subtitle?: string;
  issueDate: string;
  city?: string;
  currency: "COP" | "USD";
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

  public static createEmpty(id: string, now: Date): Proposal {
    const isoNow = now.toISOString();

    return new Proposal({
      id,
      metadata: {
        title: "Nueva propuesta comercial",
        subtitle: "",
        issueDate: isoNow,
        city: "",
        currency: "COP",
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
    };
  }

  public addSection(section: ProposalSection, now: Date): Proposal {
    if (!section.title.trim()) {
      throw new DomainError("Section title is required");
    }

    const next = this.snapshot;
    next.sections.push(section);
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

    next.updatedAt = now.toISOString();
    return Proposal.rehydrate(next);
  }

  public deleteSection(sectionId: string, now: Date): Proposal {
    const next = this.snapshot;
    next.sections = next.sections.filter((section) => section.id !== sectionId);
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
    next.updatedAt = now.toISOString();
    return Proposal.rehydrate(next);
  }

  public updateMetadata(metadata: Partial<ProposalMetadata>, now: Date): Proposal {
    const next = this.snapshot;

    if (metadata.title !== undefined && !metadata.title.trim()) {
      throw new DomainError("Title is required");
    }

    next.metadata = { ...next.metadata, ...metadata };
    next.updatedAt = now.toISOString();
    return Proposal.rehydrate(next);
  }

  public updateClient(client: Partial<ProposalClientInfo>, now: Date): Proposal {
    const next = this.snapshot;

    if (client.name !== undefined && !client.name.trim()) {
      throw new DomainError("Client name is required");
    }

    next.client = { ...next.client, ...client };
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
    next.updatedAt = now.toISOString();
    return Proposal.rehydrate(next);
  }

  public updateInvestment(investment: Partial<ProposalInvestment>, now: Date): Proposal {
    const next = this.snapshot;
    next.investment = { ...next.investment, ...investment };
    next.updatedAt = now.toISOString();
    return Proposal.rehydrate(next);
  }

  public updateClosing(closingText: string, showSignature: boolean, now: Date): Proposal {
    const next = this.snapshot;
    next.closingText = closingText;
    next.showSignature = showSignature;
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
      const issueDate = new Date(this.props.metadata.issueDate);
      const isIssueDateValid = !Number.isNaN(issueDate.getTime());
      const offerValidityDays = this.props.investment.offerValidityDays ?? 30;

      if (isIssueDateValid) {
        const now = new Date();
        const daysSinceIssue = Math.floor((now.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
        const isExpired = offerValidityDays - daysSinceIssue <= 0;

        if (isExpired) {
          issues.push({
            code: "expired-offer-validity",
            message: "La vigencia de la oferta esta expirada. Actualiza la fecha o la vigencia para continuar.",
          });
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}
