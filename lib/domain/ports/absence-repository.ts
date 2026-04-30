import type { Absence, AbsenceSummaryRow } from "../entities/absence"

export interface AbsenceFilter {
  year?: number
  month?: number
  studentName?: string
}

export interface AbsenceRepository {
  findAll(filter: AbsenceFilter): Promise<Absence[]>
  findById(id: string): Promise<Absence | null>
  create(absence: Omit<Absence, "_id">): Promise<string>
  update(id: string, data: Partial<Absence>): Promise<boolean>
  delete(id: string): Promise<boolean>
  findDistinctStudentNames(query?: string): Promise<string[]>
  aggregateSummary(): Promise<AbsenceSummaryRow[]>
}
