import { useRouter, useSearchParams } from "next/navigation"
import { type Dispatch, type SetStateAction, useEffect } from "react"
import type { Event } from "@/lib/domain/entities/event"

export function useEventDeepLink(
  events: Event[],
  openEdit: (event: Event) => void,
  setSelectedDate: Dispatch<SetStateAction<Date>>
) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const requestedEventId = searchParams.get("eventId")
  const requestedYear = Number(searchParams.get("year"))
  const requestedMonth = Number(searchParams.get("month"))

  useEffect(() => {
    if (!requestedEventId) return
    if (
      Number.isInteger(requestedYear) &&
      Number.isInteger(requestedMonth) &&
      requestedMonth >= 1 &&
      requestedMonth <= 12
    ) {
      setSelectedDate((prev) => {
        if (
          prev.getFullYear() === requestedYear &&
          prev.getMonth() + 1 === requestedMonth
        ) {
          return prev
        }
        return new Date(requestedYear, requestedMonth - 1, 1)
      })
    }
  }, [requestedEventId, requestedYear, requestedMonth, setSelectedDate])

  useEffect(() => {
    if (!requestedEventId) return
    const target = events.find((event) => event._id === requestedEventId)
    if (!target) return

    openEdit(target)

    const params = new URLSearchParams(searchParams.toString())
    params.delete("eventId")
    const next = params.toString()
    router.replace(next ? `/events?${next}` : "/events")
  }, [requestedEventId, events, router, searchParams, openEdit])
}
