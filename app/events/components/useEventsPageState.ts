import { useCallback, useMemo, useState } from "react"
import type { Event } from "@/lib/domain/entities/event"
import {
  useAddEventAttendee,
  useCreateEvent,
  useDeleteEvent,
  useUpdateEvent,
} from "@/lib/hooks/useEventMutations"
import { useEvents } from "@/lib/hooks/useEvents"
import { type EventFormValues, valuesFromEvent } from "./eventFormModal-utils"
import {
  copyAttendeesToEvent,
  type EventsFormState,
  extractEventErrorMessage,
  filterDayEvents,
  mapFormValuesToEventInput,
} from "./eventsPageContent-utils"
import { useEventDeepLink } from "./useEventDeepLink"

export function useEventsPageState() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [showCalendar, setShowCalendar] = useState(false)
  const [formState, setFormState] = useState<EventsFormState>({
    open: false,
    mode: "create",
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [dayModalKey, setDayModalKey] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [prefillDay, setPrefillDay] = useState<number | null>(null)
  const [copySeed, setCopySeed] = useState<EventFormValues | null>(null)
  const [copyKey, setCopyKey] = useState(0)
  const [copySourceEvent, setCopySourceEvent] = useState<Event | null>(null)
  const [deleteDialogEvent, setDeleteDialogEvent] = useState<Event | null>(null)
  const [deleteDialogError, setDeleteDialogError] = useState<string | null>(
    null
  )

  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth() + 1

  const { events } = useEvents({ year, month })

  const createMutation = useCreateEvent()
  const updateMutation = useUpdateEvent()
  const deleteMutation = useDeleteEvent()
  const addAttendeeMutation = useAddEventAttendee()

  const currentMonthStart = useMemo(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  }, [])
  const isViewingCurrentMonth =
    selectedDate.getFullYear() === currentMonthStart.getFullYear() &&
    selectedDate.getMonth() === currentMonthStart.getMonth()

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setSelectedDate(new Date(newYear, newMonth, 1))
  }
  const handleGoToCurrentMonth = () => {
    if (isViewingCurrentMonth) return
    setSelectedDate(currentMonthStart)
  }

  const dayEvents = useMemo(
    () => filterDayEvents(events, dayModalKey),
    [events, dayModalKey]
  )

  const editEventSnapshot =
    formState.mode === "edit" ? formState.event : undefined
  const liveEditEvent = useMemo<Event | undefined>(() => {
    if (!editEventSnapshot?._id) return editEventSnapshot
    return (
      events.find((e) => e._id === editEventSnapshot._id) ?? editEventSnapshot
    )
  }, [events, editEventSnapshot])

  const openCreate = (prefill?: number) => {
    setFormError(null)
    setPrefillDay(prefill ?? null)
    setCopySeed(null)
    setCopySourceEvent(null)
    setFormState({ open: true, mode: "create" })
  }
  const openCopy = (event: Event) => {
    setFormError(null)
    setPrefillDay(null)
    setCopySeed(valuesFromEvent(event))
    setCopySourceEvent(event)
    setCopyKey((n) => n + 1)
    setFormState({ open: true, mode: "create" })
  }
  const openEdit = useCallback((event: Event) => {
    setFormError(null)
    setFormState({ open: true, mode: "edit", event })
  }, [])

  useEventDeepLink(events, openEdit, setSelectedDate)

  const closeForm = () => {
    setFormState((prev) => ({ ...prev, open: false }))
    setFormError(null)
    setPrefillDay(null)
    setCopySeed(null)
    setCopySourceEvent(null)
  }

  const formDefaults = useMemo<Partial<EventFormValues>>(
    () => ({
      year: String(selectedDate.getFullYear()),
      month: String(selectedDate.getMonth() + 1),
      day: prefillDay ? String(prefillDay) : "",
      durationMinutes: "180",
      maxAttendees: "10",
      vatRate: "21",
    }),
    [selectedDate, prefillDay]
  )

  const handleSubmit = async (values: EventFormValues) => {
    setFormError(null)
    const payload = mapFormValuesToEventInput(values)
    try {
      if (formState.mode === "edit" && formState.event?._id) {
        await updateMutation.trigger({
          id: formState.event._id,
          ...payload,
          excludedDates: formState.event.excludedDates,
        })
        setToast("Event updated")
      } else {
        const created = await createMutation.trigger(payload)
        const msg = copySourceEvent
          ? await copyAttendeesToEvent(
              copySourceEvent,
              created.id,
              addAttendeeMutation.trigger
            )
          : "Event created"
        setToast(msg)
      }
      closeForm()
    } catch (error) {
      setFormError(extractEventErrorMessage(error, "Failed to save event"))
    }
  }

  const handleDelete = (event: Event) => {
    setDeleteDialogError(null)
    setDeleteDialogEvent(event)
  }

  const handleCancelDelete = () => {
    setDeleteDialogEvent(null)
    setDeleteDialogError(null)
  }

  const handleConfirmDelete = async () => {
    if (!deleteDialogEvent?._id) {
      setDeleteDialogError("Event ID is missing")
      return
    }
    try {
      await deleteMutation.trigger({ id: deleteDialogEvent._id })
      setToast("Event deleted")
      setDeleteDialogEvent(null)
      setDeleteDialogError(null)
    } catch (error) {
      setDeleteDialogError(
        extractEventErrorMessage(error, "Failed to delete event")
      )
    }
  }

  const handleSkipOccurrence = async (event: Event, key: string) => {
    if (!event._id) return
    const next = Array.from(new Set([...(event.excludedDates ?? []), key]))
    try {
      await updateMutation.trigger({ id: event._id, excludedDates: next })
      setToast(`Occurrence on ${key} skipped`)
    } catch (error) {
      setToast(extractEventErrorMessage(error, "Failed to skip occurrence"))
    }
  }

  const handlePersistExcludedDates = async (excludedDates: string[]) => {
    const eventId = formState.mode === "edit" ? formState.event?._id : undefined
    if (!eventId) return
    setFormState((prev) => {
      if (prev.mode !== "edit" || !prev.event) return prev
      return { ...prev, event: { ...prev.event, excludedDates } }
    })
    try {
      await updateMutation.trigger({ id: eventId, excludedDates })
      setToast("Occurrences updated")
    } catch (error) {
      setToast(extractEventErrorMessage(error, "Failed to update occurrences"))
    }
  }

  const isSubmitting =
    formState.mode === "edit"
      ? updateMutation.isMutating
      : createMutation.isMutating

  return {
    events,
    selectedDate,
    showCalendar,
    setShowCalendar,
    isViewingCurrentMonth,
    handleMonthChange,
    handleGoToCurrentMonth,
    formState,
    formError,
    formDefaults,
    copySeed,
    copyKey,
    dayModalKey,
    setDayModalKey,
    dayEvents,
    liveEditEvent,
    toast,
    setToast,
    deleteDialogEvent,
    deleteDialogError,
    isSubmitting,
    isDeletePending: deleteMutation.isMutating,
    openCreate,
    openCopy,
    openEdit,
    closeForm,
    handleSubmit,
    handleDelete,
    handleCancelDelete,
    handleConfirmDelete,
    handleSkipOccurrence,
    handlePersistExcludedDates,
  }
}
