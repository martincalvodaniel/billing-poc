import type { CompanyInfo } from "@/lib/domain/entities/companyInfo"

export interface CompanyInfoRepository {
  findOne(): Promise<Partial<CompanyInfo> | null>
}
