import { ProposalIssuerProfile } from "../../domain/entities/Proposal";

const COMPANY_SETTINGS_STORAGE_KEY = "proposal:company-settings";

export const defaultCompanySettings: ProposalIssuerProfile = {
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

export const loadCompanySettings = (): ProposalIssuerProfile | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(COMPANY_SETTINGS_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ProposalIssuerProfile;
    return {
      ...defaultCompanySettings,
      ...parsed,
    };
  } catch {
    return null;
  }
};

export const saveCompanySettings = (settings: ProposalIssuerProfile): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(COMPANY_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};
