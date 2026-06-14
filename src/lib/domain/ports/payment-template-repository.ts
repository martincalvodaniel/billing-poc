import type { PaymentTemplate } from "../entities/payment-template"

export type PaymentTemplateUpdateData = Partial<
  Omit<PaymentTemplate, "_id" | "createdAt" | "updatedAt">
>

export interface PaymentTemplateRepository {
  findAll(): Promise<PaymentTemplate[]>
  findById(id: string): Promise<PaymentTemplate | null>
  create(template: Omit<PaymentTemplate, "_id">): Promise<string>
  update(id: string, data: PaymentTemplateUpdateData): Promise<boolean>
  delete(id: string): Promise<boolean>
}
