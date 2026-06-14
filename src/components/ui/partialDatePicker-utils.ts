export interface PartialDateValue {
  year?: number
  month?: number
  day?: number
}

/**
 * Returns the input value with dependent fields cleared:
 * - clearing year clears month and day
 * - clearing month clears day
 */
export function coerceValue(value: PartialDateValue): PartialDateValue {
  const year = value.year
  if (typeof year !== "number") {
    return {}
  }
  const month = value.month
  if (typeof month !== "number") {
    return { year }
  }
  const day = value.day
  if (typeof day !== "number") {
    return { year, month }
  }
  const validDays = daysValidFor(year, month)
  if (!validDays.includes(day)) {
    return { year, month }
  }
  return { year, month, day }
}

/**
 * Returns the valid month numbers (1..12) for the given year.
 * Year-independent, but kept as a function for API symmetry.
 */
export function monthsValidFor(year: number | undefined): number[] {
  if (typeof year !== "number") return []
  return Array.from({ length: 12 }, (_, i) => i + 1)
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * Returns the array of valid day numbers for the given Gregorian (year, month).
 * Month is 1-indexed. Returns [] when year or month are missing.
 */
export function daysValidFor(
  year: number | undefined,
  month: number | undefined
): number[] {
  if (typeof year !== "number" || typeof month !== "number") return []
  if (month < 1 || month > 12) return []
  let length: number
  if (month === 2) {
    length = isLeapYear(year) ? 29 : 28
  } else if ([4, 6, 9, 11].includes(month)) {
    length = 30
  } else {
    length = 31
  }
  return Array.from({ length }, (_, i) => i + 1)
}

/**
 * Returns the number of empty Monday-first calendar cells before day 1.
 * Month is 1-indexed. Returns 0 when year or month are missing or invalid.
 */
export function dayCalendarOffset(
  year: number | undefined,
  month: number | undefined
): number {
  if (typeof year !== "number" || typeof month !== "number") return 0
  if (month < 1 || month > 12) return 0
  const firstOfMonth = new Date(0, month - 1, 1)
  firstOfMonth.setFullYear(year)
  return (firstOfMonth.getDay() + 6) % 7
}
