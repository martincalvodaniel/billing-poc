export type AbsenceType = "absence" | "recovery"

export type PartOfDay = "morning" | "evening"

export interface Absence {
  _id?: string
  type: AbsenceType
  studentName: string
  date: string // YYYY-MM-DD
  partOfDay: PartOfDay
  comment?: string
  createdAt: Date
  updatedAt: Date
}

export interface AbsenceFormData {
  type: AbsenceType
  studentName: string
  date: string
  partOfDay: PartOfDay
  comment?: string
}

export interface AbsenceSummaryRow {
  studentName: string
  totalAbsences: number
  totalRecoveries: number
  pending: number
  lastAbsenceDate: string | null
}
