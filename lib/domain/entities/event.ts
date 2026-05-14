export interface EventAttendee {
  clientId: string
  seats: number
  paymentId?: string
  addedAt: Date
}

export interface Event {
  _id?: string
  title: string
  description?: string
  year?: number
  month?: number // 1–12
  day?: number // 1–31
  hour?: number // 0–23
  minute?: number // 0–59
  date?: string // derived YYYY-MM-DD when year+month+day all set
  durationMinutes?: number
  maxAttendees?: number
  netAmount: number // per seat (per hour if duration set)
  vatAmount: number // per seat (per hour if duration set)
  attendees: EventAttendee[]
  createdAt: Date
  updatedAt: Date
}

export interface EventFormData {
  title: string
  description?: string
  year?: string
  month?: string
  day?: string
  hour?: string
  minute?: string
  durationMinutes?: string
  maxAttendees?: string
  netAmount: string
  vatAmount: string
}
