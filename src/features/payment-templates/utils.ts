import type { PaymentFormData } from "@/lib/domain/entities/payment"
import type { PaymentTemplate } from "@/lib/domain/entities/payment-template"

function formatOptionalNumber(value: number | undefined): string {
  return typeof value === "number" ? String(value) : ""
}

export function buildPaymentTemplateFormData(
  template: PaymentTemplate,
  date: string
): PaymentFormData {
  return {
    date,
    type: template.type,
    concepts: template.concepts.map((concept) => ({ ...concept })),
    vat: String(template.vat),
    surcharge: formatOptionalNumber(template.surcharge),
    discount: formatOptionalNumber(template.discount),
    tag: template.tag ?? "",
    clientId: template.clientId,
    deliveryNoteRef: template.deliveryNoteRef ?? "",
    paymentMethod: template.paymentMethod ?? "",
  }
}

export interface CreatePaymentTemplatePayload {
  name: string
  type: PaymentTemplate["type"]
  concepts: PaymentTemplate["concepts"]
  vat: number
  surcharge?: number
  discount?: number
  tag?: string
  clientId?: string
  deliveryNoteRef?: string
  paymentMethod?: PaymentTemplate["paymentMethod"]
}

export interface UpdatePaymentTemplatePayload
  extends CreatePaymentTemplatePayload {
  id: string
}

function buildPaymentTemplatePayload(
  name: string,
  formData: PaymentFormData
): CreatePaymentTemplatePayload {
  const trimmedName = name.trim()
  const tag = formData.tag?.trim()
  const deliveryNoteRef = formData.deliveryNoteRef?.trim()
  const surcharge = formData.surcharge?.trim()
  const discount = formData.discount?.trim()

  return {
    name: trimmedName,
    type: formData.type,
    concepts: formData.concepts.map((concept) => ({ ...concept })),
    vat: Number.parseFloat(formData.vat),
    surcharge: surcharge ? Number.parseFloat(surcharge) : undefined,
    discount: discount ? Number.parseFloat(discount) : undefined,
    tag: tag ? tag : undefined,
    clientId: formData.clientId?.trim() ? formData.clientId.trim() : undefined,
    deliveryNoteRef: deliveryNoteRef ? deliveryNoteRef : undefined,
    paymentMethod: formData.paymentMethod || undefined,
  }
}

export function buildCreatePaymentTemplatePayload(
  name: string,
  formData: PaymentFormData
): CreatePaymentTemplatePayload {
  return buildPaymentTemplatePayload(name, formData)
}

export function buildUpdatePaymentTemplatePayload(
  id: string,
  name: string,
  formData: PaymentFormData
): UpdatePaymentTemplatePayload {
  return {
    id,
    ...buildPaymentTemplatePayload(name, formData),
  }
}
