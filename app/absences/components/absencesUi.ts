import type { AbsenceType, PartOfDay } from "@/lib/domain/entities/absence"
import { FetchError } from "@/lib/swr-fetcher"

export const PART_OF_DAY_LABEL: Record<PartOfDay, string> = {
  morning: "Morning",
  evening: "Evening",
}

export const TYPE_LABEL: Record<AbsenceType, string> = {
  absence: "Absence",
  recovery: "Recovery",
}

export const TYPE_DOT_CLASS: Record<AbsenceType, string> = {
  absence: "bg-red-500",
  recovery: "bg-green-500",
}

export function extractAbsenceErrorMessage(err: unknown): string {
  if (
    err instanceof FetchError &&
    err.info &&
    typeof err.info === "object" &&
    "error" in err.info &&
    typeof (err.info as { error: unknown }).error === "string"
  ) {
    return (err.info as { error: string }).error
  }
  if (err instanceof Error) return err.message
  return "An error occurred"
}
