import type { PaymentTemplate } from "../entities/payment-template"

export interface PaymentTemplateRepository {
  findAll(): Promise<PaymentTemplate[]>
  findById(id: string): Promise<PaymentTemplate | null>
  create(template: Omit<PaymentTemplate, "_id">): Promise<string>
}
