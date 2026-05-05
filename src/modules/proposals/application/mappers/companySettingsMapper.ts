import { IssuerFormDTO } from "../dtos/schemas";
import { defaultCompanySettings } from "../../infrastructure/browser/companySettings";

export const mapIssuerFormData = (settings?: Partial<IssuerFormDTO>): IssuerFormDTO => ({
  businessName: settings?.businessName ?? defaultCompanySettings.businessName,
  responsibleName: settings?.responsibleName ?? defaultCompanySettings.responsibleName,
  role: settings?.role ?? defaultCompanySettings.role,
  email: settings?.email ?? defaultCompanySettings.email,
  phone: settings?.phone ?? defaultCompanySettings.phone ?? "",
  website: settings?.website ?? defaultCompanySettings.website ?? "",
  logoUrl: settings?.logoUrl ?? defaultCompanySettings.logoUrl ?? "",
  signatureText: settings?.signatureText ?? defaultCompanySettings.signatureText,
  signatureFont: settings?.signatureFont ?? defaultCompanySettings.signatureFont,
});
