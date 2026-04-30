/**
 * Shared payment calculation utilities used by both PaymentForm and PaymentDetailModal
 */

/**
 * Calculate the total amount from all concepts
 */
export const calculateTotal = (
  concepts: Array<{ name: string; amount: number; quantity: number }>
): number => {
  return concepts.reduce((sum, c) => sum + c.amount * (c.quantity || 1), 0)
}

/**
 * Calculate the VAT amount based on total and VAT percentage
 * Uses formula: VAT = Total * (VAT% / 100) / (1 + VAT% / 100 + Surcharge% / 100)
 */
export const calculateVatAmount = (
  total: number,
  vatPercentage: number,
  surchargePercentage: number = 0
): number => {
  const vat =
    (total * (vatPercentage / 100)) /
    (1 + vatPercentage / 100 + surchargePercentage / 100)
  return parseFloat(vat.toFixed(2))
}

/**
 * Calculate the surcharge amount based on total and surcharge percentage
 * Uses formula: Surcharge = Total * (Surcharge% / 100) / (1 + VAT% / 100 + Surcharge% / 100)
 */
export const calculateSurchargeAmount = (
  total: number,
  vatPercentage: number,
  surchargePercentage: number = 0
): number => {
  if (surchargePercentage === 0) return 0
  const surcharge =
    (total * (surchargePercentage / 100)) /
    (1 + vatPercentage / 100 + surchargePercentage / 100)
  return parseFloat(surcharge.toFixed(2))
}

/**
 * Calculate the net amount after deductions
 * Uses formula: Net = Total / (1 + VAT% / 100 + Surcharge% / 100)
 */
export const calculateNetAmount = (
  total: number,
  vatPercentage: number,
  surchargePercentage: number = 0
): string => {
  const net = total / (1 + vatPercentage / 100 + surchargePercentage / 100)
  return net.toFixed(2)
}

/**
 * Validate concepts array
 * @returns { isValid: boolean; error: string | null }
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
