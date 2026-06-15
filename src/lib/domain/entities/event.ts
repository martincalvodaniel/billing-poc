export interface EventAttendee {
  clientId: string
  seats: number
  paymentId?: string
  addedAt: Date
}

export interface Event {
  _id?: string
  title: string
  tag?: string
  year?: number
  month?: number // 1–12
  day?: number // 1–31 (concrete-date events; mutually exclusive with dayOfWeek for new events)
  dayOfWeek?: number // 0=Sunday..6=Saturday — weekly recurrence within the event's year+month
  excludedDates?: string[] // ISO YYYY-MM-DD occurrences removed from the recurrence (e.g. holidays)
  hour?: number // 0–23
  minute?: number // 0–59
  date?: string // derived YYYY-MM-DD when year+month+day all set
  durationMinutes?: number
  maxAttendees?: number
  pricePerSeat: number // gross euros per seat, VAT included
  vatRate: number // VAT rate as a percentage, 0–100
  attendees: EventAttendee[]
  createdAt: Date
  updatedAt: Date
}
