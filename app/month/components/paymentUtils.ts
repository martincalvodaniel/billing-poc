/**
 * Shared payment calculation utilities
 * Re-exports from domain services for backward compatibility
 */

export {
  calculateNetAmount,
  calculateSurchargeAmount,
  calculateTotal,
  calculateVatAmount,
} from "@/lib/domain/services/payment-calculator"

/**
 * Validate concepts array
 */
export const validateConcepts = (
  concepts: Array<{ name: string; amount: number; quantity: number }>
): { isValid: boolean; error: string | null } => {
  const validConcepts = concepts.filter((c) => c.amount > 0)
  if (validConcepts.length === 0) {
    return {
      isValid: false,
      error: "At least one concept must have an amount greater than 0",
    }
  }

  if (concepts.some((c) => !c.name || c.name.trim() === "")) {
    return {
      isValid: false,
      error: "All concepts must have a name",
    }
  }

  return { isValid: true, error: null }
}

/**
 * Validate VAT percentage
 */
export const validateVat = (
  vat: string
): { isValid: boolean; error: string | null } => {
  const vatNumber = parseFloat(vat)
  if (Number.isNaN(vatNumber) || vatNumber < 0 || vatNumber > 100) {
    return {
      isValid: false,
      error: "VAT must be between 0 and 100",
    }
  }
  return { isValid: true, error: null }
}

/**
 * Validate surcharge percentage
 */
export const validateSurcharge = (
  surcharge: string | undefined
): { isValid: boolean; error: string | null } => {
  if (!surcharge || surcharge.trim() === "") {
    return { isValid: true, error: null }
  }

  const surchargeNumber = parseFloat(surcharge)
  if (
    Number.isNaN(surchargeNumber) ||
    surchargeNumber < 0 ||
    surchargeNumber > 100
  ) {
    return {
      isValid: false,
      error: "Surcharge must be between 0 and 100",
    }
  }
  return { isValid: true, error: null }
}

/**
 * Validate discount amount (EUR). Must be non-negative and not exceed the
 * concepts subtotal. Empty/whitespace is treated as 0 (no discount).
 */
export const validateDiscount = (
  discount: string | undefined,
  conceptsTotal: number
): { isValid: boolean; error: string | null } => {
  if (!discount || discount.trim() === "") {
    return { isValid: true, error: null }
  }

  const discountNumber = parseFloat(discount)
  if (Number.isNaN(discountNumber) || discountNumber < 0) {
    return {
      isValid: false,
      error: "Discount must be a non-negative number",
    }
  }
  if (discountNumber > conceptsTotal) {
    return {
      isValid: false,
      error: "Discount cannot exceed the concepts total",
    }
  }
  return { isValid: true, error: null }
}
