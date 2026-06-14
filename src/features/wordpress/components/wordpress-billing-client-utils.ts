import type { ClientFormData } from "@/lib/domain/entities/client"
import type { WordPressOrder } from "@/lib/domain/entities/wordpress-order"

export type ClientDiffField = "name" | "phone" | "email"

export interface ClientDiffRow {
  field: ClientDiffField
  label: string
  currentValue: string
  nextValue: string
}

export type SelectedClientDiffFields = Record<ClientDiffField, boolean>

export function createEmptySelectedDiffFields(): SelectedClientDiffFields {
  return {
    name: false,
    phone: false,
    email: false,
  }
}

export function normalizeField(value: string | undefined): string {
  const trimmed = value?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : "-"
}

function toOptional(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function getBillingName(order: WordPressOrder): string {
  return `${order.billing.first_name} ${order.billing.last_name}`.trim()
}

export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase()
}

export function getBillingPayload(
  order: WordPressOrder
): Pick<ClientFormData, "name" | "phone" | "email"> {
  return {
    name: getBillingName(order),
    phone: toOptional(order.billing.phone),
    email: toOptional(order.billing.email),
  }
}
