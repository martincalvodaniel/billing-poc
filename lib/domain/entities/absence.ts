export type AbsenceType = "absence" | "recovery"

export interface Absence {
  _id?: string
  type: AbsenceType
  studentName: string
  date: string // YYYY-MM-DD
  comment?: string
  createdAt: Date
  updatedAt: Date
}

export interface AbsenceFormData {
  type: AbsenceType
  studentName: string
  date: string
  comment?: string
}

export interface AbsenceSummaryRow {
  studentName: string
  totalAbsences: number
  totalRecoveries: number
  pending: number
  lastAbsenceDate: string | null
}
