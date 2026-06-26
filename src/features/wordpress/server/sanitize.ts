import type { WordPressBilling } from "@/lib/domain/entities/wordpress-order"

export function toCapitalCase(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("es-ES")
    .replace(/(^|[\s'-])(\p{L})/gu, (_match, separator, letter) => {
      return `${separator}${letter.toLocaleUpperCase("es-ES")}`
    })
}

export function sanitizeWordPressPhone(value: string): string {
  return value
    .trim()
    .replace(/^\+34\s*/, "")
    .replace(/(\d)\s+(?=\d)/g, "$1")
}

export function sanitizeWordPressBilling(
  billing: WordPressBilling
): WordPressBilling {
  return {
    ...billing,
    first_name: toCapitalCase(billing.first_name),
    last_name: toCapitalCase(billing.last_name),
    phone: sanitizeWordPressPhone(billing.phone),
  }
}
