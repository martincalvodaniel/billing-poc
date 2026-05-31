"use client"

import dynamic from "next/dynamic"
import { useMemo, useState } from "react"
import AddButton from "@/app/components/AddButton"
import { ConfirmDialog } from "@/app/components/ConfirmDialog"
import PageLayout from "@/app/components/PageLayout"
import Toast from "@/app/components/Toast"
import MonthPicker from "@/app/month/components/MonthPicker"
import type { Event } from "@/lib/domain/entities/event"
import { formatMonthYear } from "@/lib/formatters"
import {
  useAddEventAttendee,
  useCreateEvent,
  useDeleteEvent,
  useUpdateEvent,
} from "@/lib/hooks/useEventMutations"
import { useEvents } from "@/lib/hooks/useEvents"
import { eventOccursOnRecurringDate } from "./calendar/calendarUtils"
import EventsListTable from "./EventsListTable"
import EventsMonthCalendar from "./EventsMonthCalendar"
import { type EventFormValues, valuesFromEvent } from "./eventFormModal-utils"
import {
  type EventsFormState,
  extractEventErrorMessage,
  toOptionalNumber,
  toRequiredNumber,
} from "./eventsPageContent-utils"
import { formatEventDateTime } from "./eventsUi"

const DayEventsModal = dynamic(() => import("./DayEventsModal"), {
  ssr: false,
})
const EditEventModal = dynamic(() => import("./EditEventModal"), {
  ssr: false,
})
const NewEventModal = dynamic(() => import("./NewEventModal"), {
  ssr: false,
})

export default function EventsPageContent() {
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

  const dayEvents = useMemo(() => {
    if (!dayModalKey) return []
    const [yStr, mStr, dStr] = dayModalKey.split("-")
    const y = Number(yStr)
    const m = Number(mStr)
    const d = Number(dStr)
    const date = new Date(y, m - 1, d)
    return events.filter((e) => {
      if (e.date === dayModalKey) return true
      return eventOccursOnRecurringDate(e, date, dayModalKey)
    })
  }, [events, dayModalKey])

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
    const seed = valuesFromEvent(event)
    setCopySeed(seed)
    setCopySourceEvent(event)
    setCopyKey((n) => n + 1)
    setFormState({ open: true, mode: "create" })
  }
  const openEdit = (event: Event) => {
    setFormError(null)
    setFormState({ open: true, mode: "edit", event })
  }
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
    try {
      if (formState.mode === "edit" && formState.event?._id) {
        await updateMutation.trigger({
          id: formState.event._id,
          title: values.title.trim(),
          tag: values.tag.trim() || undefined,
          year: toOptionalNumber(values.year),
          month: toOptionalNumber(values.month),
          day: toOptionalNumber(values.day),
          dayOfWeek: toOptionalNumber(values.dayOfWeek),
          hour: toOptionalNumber(values.hour),
          minute: toOptionalNumber(values.minute),
          durationMinutes: toOptionalNumber(values.durationMinutes),
          maxAttendees: toOptionalNumber(values.maxAttendees),
          pricePerSeat: toRequiredNumber(values.pricePerSeat),
          vatRate: toRequiredNumber(values.vatRate),
        })
        setToast("Event updated")
      } else {
        const created = await createMutation.trigger({
          title: values.title.trim(),
          tag: values.tag.trim() || undefined,
          year: toOptionalNumber(values.year),
          month: toOptionalNumber(values.month),
          day: toOptionalNumber(values.day),
          dayOfWeek: toOptionalNumber(values.dayOfWeek),
          hour: toOptionalNumber(values.hour),
          minute: toOptionalNumber(values.minute),
          durationMinutes: toOptionalNumber(values.durationMinutes),
          maxAttendees: toOptionalNumber(values.maxAttendees),
          pricePerSeat: toRequiredNumber(values.pricePerSeat),
          vatRate: toRequiredNumber(values.vatRate),
        })

        if (
          copySourceEvent?.dayOfWeek !== undefined &&
          copySourceEvent.attendees.length > 0
        ) {
          const results = await Promise.allSettled(
            copySourceEvent.attendees.map((attendee) =>
              addAttendeeMutation.trigger({
                eventId: created.id,
                clientId: attendee.clientId,
                seats: attendee.seats,
              })
            )
          )
          const copied = results.filter((r) => r.status === "fulfilled").length
          const failed = results.length - copied
          if (failed > 0) {
            setToast(
              `Event created. ${copied} attendees copied, ${failed} failed`
            )
          } else {
            setToast(`Event created with ${copied} attendees copied`)
          }
        } else {
          setToast("Event created")
        }
      }
      closeForm()
    } catch (error) {
      setFormError(extractEventErrorMessage(error, "Failed to save event"))
    }
  }

  const handleDelete = async (event: Event) => {
    setDeleteDialogError(null)
    setDeleteDialogEvent(event)
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

  const isSubmitting =
    formState.mode === "edit"
      ? updateMutation.isMutating
      : createMutation.isMutating

  return (
    <PageLayout
      navigationSubtitle="Events"
      headerContent={
        <div className="space-y-2 rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 border-b border-zinc-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Events
              </p>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {formatMonthYear(selectedDate)}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AddButton ariaLabel="Add event" onClick={() => openCreate()} />
              <MonthPicker
                selectedDate={selectedDate}
                onMonthChange={handleMonthChange}
                showCalendar={showCalendar}
                onShowCalendarChange={setShowCalendar}
                isViewingCurrentMonth={isViewingCurrentMonth}
                onGoToCurrentMonth={handleGoToCurrentMonth}
              />
            </div>
          </div>
        </div>
      }
    >
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="space-y-8">
        <EventsMonthCalendar
          events={events}
          selectedDate={selectedDate}
          onDayClick={setDayModalKey}
          onEventClick={openEdit}
        />
        <EventsListTable
          events={events}
          onEdit={openEdit}
          onDelete={handleDelete}
          onCopy={openCopy}
        />
      </div>

      {formState.mode === "edit" && formState.event && liveEditEvent ? (
        <EditEventModal
          event={liveEditEvent}
          isOpen={formState.open}
          onClose={closeForm}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errorMessage={formError}
          onAttendeeSuccess={(msg) => setToast(msg)}
          onAttendeeError={(msg) => setToast(msg)}
        />
      ) : (
        <NewEventModal
          isOpen={formState.open}
          onClose={closeForm}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errorMessage={formError}
          defaults={formDefaults}
          seedValues={copySeed}
          resetKey={copySeed ? `copy-${copyKey}` : "create"}
        />
      )}

      {dayModalKey && (
        <DayEventsModal
          dateKey={dayModalKey}
          events={dayEvents}
          onClose={() => setDayModalKey(null)}
          onEdit={(e) => {
            setDayModalKey(null)
            openEdit(e)
          }}
          onDelete={(e) => {
            void handleDelete(e)
          }}
          onSkipOccurrence={(e, key) => {
            void handleSkipOccurrence(e, key)
          }}
          onAddEventForDay={(day) => {
            setDayModalKey(null)
            openCreate(day)
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteDialogEvent}
        title="Delete event"
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        variant="danger"
        isPending={deleteMutation.isMutating}
        error={deleteDialogError}
        onCancel={() => {
          setDeleteDialogEvent(null)
          setDeleteDialogError(null)
        }}
        onConfirm={() => {
          void handleConfirmDelete()
        }}
      >
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Delete event{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {deleteDialogEvent?.title ?? ""}
          </span>
          ? This cannot be undone.
        </p>
        {deleteDialogEvent && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Date & Time: {formatEventDateTime(deleteDialogEvent)}
          </p>
        )}
      </ConfirmDialog>
    </PageLayout>
  )
}
