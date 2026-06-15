import type { CompanyInfo } from "@/lib/domain/entities/companyInfo"

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: "My company Name",
  taxId: "My company Tax ID",
  addressLine: "My company Address Line",
  postalCode: "My company Postal Code",
  city: "My company City",
  country: "My company Country",
  phone: "My company Phone",
  email: "info@mycompany.com",
  logoUrl: undefined,
}

function pickString(
  partial: Partial<CompanyInfo> | null,
  key: keyof CompanyInfo,
  fallback: string
): string {
  const raw = partial?.[key]
  if (typeof raw === "string" && raw.trim().length > 0) return raw
  return fallback
}

export function withDefaults(
  partial: Partial<CompanyInfo> | null
): CompanyInfo {
  const logoRaw = partial?.logoUrl
  const logoUrl =
    typeof logoRaw === "string" && logoRaw.trim().length > 0
      ? logoRaw
      : DEFAULT_COMPANY_INFO.logoUrl

  return {
    name: pickString(partial, "name", DEFAULT_COMPANY_INFO.name),
    taxId: pickString(partial, "taxId", DEFAULT_COMPANY_INFO.taxId),
    addressLine: pickString(
      partial,
      "addressLine",
      DEFAULT_COMPANY_INFO.addressLine
    ),
    postalCode: pickString(
      partial,
      "postalCode",
      DEFAULT_COMPANY_INFO.postalCode
    ),
    city: pickString(partial, "city", DEFAULT_COMPANY_INFO.city),
    country: pickString(partial, "country", DEFAULT_COMPANY_INFO.country),
    phone: pickString(partial, "phone", DEFAULT_COMPANY_INFO.phone),
    email: pickString(partial, "email", DEFAULT_COMPANY_INFO.email),
    logoUrl,
  }
}
